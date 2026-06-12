"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import toast from "react-hot-toast";

import { initiateTransfer, previewTransfer } from "@/lib/actions/transfer.actions";

import { BankDropdown } from "./BankDropdown";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(4, "Transfer note is too short"),
  amount: z.coerce.number().positive("Enter a valid amount"),
  senderBank: z.string().min(4, "Please select a valid bank account"),
  sharableId: z.string().min(8, "Please enter a valid shareable ID"),
});

type FormValues = z.infer<typeof formSchema>;

type PreviewData = {
  amount: string;
  senderMask: string;
  receiverMask: string;
};

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "review">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      amount: undefined,
      senderBank: "",
      sharableId: "",
    },
  });

  const onReview = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const result = await previewTransfer({
        senderBankId: data.senderBank,
        receiverShareableId: data.sharableId,
        amount: data.amount,
      });
      setPreview(result as PreviewData);
      setPendingValues(data);
      setStep("review");
    } catch {
      toast.error("Could not validate transfer details");
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!pendingValues) return;
    setIsLoading(true);
    try {
      await initiateTransfer({
        senderBankId: pendingValues.senderBank,
        receiverShareableId: pendingValues.sharableId,
        amount: pendingValues.amount,
        name: pendingValues.name,
        email: pendingValues.email,
      });
      toast.success("Transfer initiated successfully");
      form.reset();
      setStep("form");
      setPreview(null);
      setPendingValues(null);
      router.push("/transfer-history");
    } catch {
      toast.error("Transfer failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "review" && preview && pendingValues) {
    return (
      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-8">
        <h2 className="text-20 font-semibold text-gray-900">Review transfer</h2>
        <div className="space-y-3 text-14 text-gray-700">
          <p><span className="font-medium">Amount:</span> ${preview.amount}</p>
          <p><span className="font-medium">From account ending in:</span> {preview.senderMask}</p>
          <p><span className="font-medium">To account ending in:</span> {preview.receiverMask}</p>
          <p><span className="font-medium">Note:</span> {pendingValues.name}</p>
          <p><span className="font-medium">Recipient email:</span> {pendingValues.email}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? <><Loader2 className="animate-spin mr-2" size={18} /> Processing...</> : "Confirm transfer"}
          </Button>
          <Button variant="outline" onClick={() => setStep("form")} disabled={isLoading}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onReview)} className="flex flex-col">
        <FormField
          control={form.control}
          name="senderBank"
          render={() => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">Select Source Bank</FormLabel>
                  <FormDescription className="text-12 font-normal text-gray-600">
                    Select the bank account you want to transfer funds from
                  </FormDescription>
                </div>
                <div className="flex w-full flex-col">
                  <FormControl>
                    <BankDropdown accounts={accounts} setValue={form.setValue} otherStyles="!w-full" />
                  </FormControl>
                  <FormMessage className="text-12 text-red-500" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-6 pt-5">
                <FormLabel className="text-14 font-medium text-gray-700">Transfer Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Write a short note here" className="input-class" {...field} />
                </FormControl>
                <FormMessage className="text-12 text-red-500" />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="text-14 font-medium text-gray-700">Recipient&apos;s Email</FormLabel>
                <FormControl>
                  <Input placeholder="ex: johndoe@gmail.com" className="input-class" {...field} />
                </FormControl>
                <FormMessage className="text-12 text-red-500" />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sharableId"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item pb-5 pt-6">
                <FormLabel className="text-14 font-medium text-gray-700">Receiver Shareable ID</FormLabel>
                <FormControl>
                  <Input placeholder="Paste shareable ID from recipient" className="input-class" {...field} />
                </FormControl>
                <FormMessage className="text-12 text-red-500" />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="border-y border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="text-14 font-medium text-gray-700">Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: 5.00"
                    className="input-class"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber || e.target.value)}
                  />
                </FormControl>
                <FormMessage className="text-12 text-red-500" />
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_btn-box">
          <Button type="submit" className="payment-transfer_btn" disabled={isLoading}>
            {isLoading ? <><Loader2 size={20} className="animate-spin" /> &nbsp; Validating...</> : "Review transfer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentTransferForm;
