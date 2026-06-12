"use server";

import { Client } from "dwolla-v2";
import { env } from "@/lib/env";

const dwollaClient = new Client({
  environment: env.DWOLLA_ENV,
  key: env.DWOLLA_KEY,
  secret: env.DWOLLA_SECRET,
});

export const testDwollaConfig = async () => {
  try {
    await dwollaClient.get("customers");
    return true;
  } catch (err) {
    console.error("Dwolla configuration test failed:", err);
    return false;
  }
};

export const createFundingSource = async (
  options: CreateFundingSourceOptions
) => {
  try {
    if (!options.customerId || options.customerId.trim() === '') {
      console.error("Invalid customer ID:", options.customerId);
      return null;
    }
    
    const customerId = options.customerId.trim();
    
    const requestBody = {
      name: options.fundingSourceName,
      plaidToken: options.plaidToken,
      _links: options._links,
    };
    
    const response = await dwollaClient
      .post(`customers/${customerId}/funding-sources`, requestBody);
    
    return response.headers.get("location");
  } catch (err: unknown) {
    const dwollaErr = err as { status?: number; body?: { code?: string; _links?: { about?: { href?: string } } } };
    console.error("Creating a Funding Source Failed: ", err);
    
    if (dwollaErr.status === 400 && dwollaErr.body?.code === 'DuplicateResource') {
      if (dwollaErr.body._links?.about?.href) {
        return dwollaErr.body._links.about.href;
      }
    }
    
    if (dwollaErr.status === 404) {
      try {
        const alternativeRequestBody = {
          name: options.fundingSourceName,
          plaidToken: options.plaidToken,
        };
        
        const alternativeResponse = await dwollaClient
          .post(`customers/${options.customerId.trim()}/funding-sources`, alternativeRequestBody);
        
        return alternativeResponse.headers.get("location");
      } catch (alternativeErr) {
        console.error("Alternative request also failed:", alternativeErr);
        return null;
      }
    }
    
    return null;
  }
};

export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      "on-demand-authorizations"
    );
    return onDemandAuthorization.body._links;
  } catch (err) {
    console.error("Creating an On Demand Authorization Failed: ", err);
    return null;
  }
};

export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams
) => {
  try {
    const configTest = await testDwollaConfig();
    if (!configTest) {
      console.error("Dwolla configuration test failed - cannot create customer");
      return null;
    }
    
    const response = await dwollaClient
      .post("customers", newCustomer);
    
    return response.headers.get("location");
  } catch (err: unknown) {
    const dwollaErr = err as { status?: number; body?: { _embedded?: { errors?: Array<{ code?: string; path?: string; message?: string }> } } };
    console.error("Creating a Dwolla Customer Failed: ", err);
    
    if (dwollaErr.status === 400 && dwollaErr.body?._embedded?.errors) {
      const duplicateError = dwollaErr.body._embedded.errors.find((error) => 
        error.code === 'Duplicate' && error.path === '/email'
      );
      
      if (duplicateError) {
        const existingCustomer = await findCustomerByEmail(newCustomer.email);
        
        if (existingCustomer) {
          const baseUrl = process.env.DWOLLA_ENV === 'production'
            ? 'https://api.dwolla.com'
            : 'https://api-sandbox.dwolla.com';
          return `${baseUrl}/customers/${existingCustomer.id}`;
        }
      }
    }
    
    return null;
  }
};

export const getCustomer = async (customerId: string) => {
  try {
    const response = await dwollaClient.get(`customers/${customerId}`);
    return response.body;
  } catch (err) {
    console.error("Getting Dwolla Customer Failed: ", err);
    return null;
  }
};

export const findCustomerByEmail = async (email: string) => {
  try {
    const response = await dwollaClient.get("customers");
    const customers = response.body._embedded?.customers || [];
    
    const existingCustomer = customers.find((customer: { email?: string }) => 
      customer.email === email
    );
    
    return existingCustomer ?? null;
  } catch (err) {
    console.error("Finding customer by email failed:", err);
    return null;
  }
};

export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {
    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    };
    return await dwollaClient
      .post("transfers", requestBody)
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Transfer fund failed: ", err);
  }
};

export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    const envTest = testEnvironmentVariables();
    if (!envTest) {
      console.error("Environment variables test failed");
      return null;
    }
    
    const configTest = await testDwollaConfig();
    if (!configTest) {
      console.error("Dwolla configuration test failed");
      return null;
    }
    
    const customer = await getCustomer(dwollaCustomerId);
    if (!customer) {
      console.error("Customer not found:", dwollaCustomerId);
      return null;
    }
    
    const dwollaAuthLinks = await createOnDemandAuthorization();
    
    if (!dwollaAuthLinks) {
      console.error("Failed to create on-demand authorization");
      return null;
    }

    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };
    
    return await createFundingSource(fundingSourceOptions);
  } catch (err) {
    console.error("Creating funding source failed: ", err);
    return null;
  }
};

export const validateCustomerData = (customerData: NewDwollaCustomerParams) => {
  const errors: string[] = [];
  
  if (!customerData.firstName || customerData.firstName.trim() === '') {
    errors.push("firstName is required");
  }
  
  if (!customerData.lastName || customerData.lastName.trim() === '') {
    errors.push("lastName is required");
  }
  
  if (!customerData.email || customerData.email.trim() === '') {
    errors.push("email is required");
  }
  
  if (!customerData.type || customerData.type.trim() === '') {
    errors.push("type is required");
  }
  
  if (!customerData.address1 || customerData.address1.trim() === '') {
    errors.push("address1 is required");
  }
  
  if (!customerData.city || customerData.city.trim() === '') {
    errors.push("city is required");
  }
  
  if (!customerData.state || customerData.state.trim() === '') {
    errors.push("state is required");
  } else if (customerData.state.length !== 2) {
    errors.push("state must be a 2-letter abbreviation");
  }
  
  if (!customerData.postalCode || customerData.postalCode.trim() === '') {
    errors.push("postalCode is required");
  }
  
  if (!customerData.dateOfBirth || customerData.dateOfBirth.trim() === '') {
    errors.push("dateOfBirth is required");
  } else if (!customerData.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
    errors.push("dateOfBirth must be in YYYY-MM-DD format");
  }
  
  if (!customerData.ssn || customerData.ssn.trim() === '') {
    errors.push("ssn is required");
  } else if (!customerData.ssn.match(/^\d{9}$/)) {
    errors.push("ssn must be 9 digits");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const testEnvironmentVariables = () => {
  try {
    const { env } = require("@/lib/env");
    return Boolean(env.DWOLLA_ENV && env.DWOLLA_KEY && env.DWOLLA_SECRET);
  } catch {
    return false;
  }
};
