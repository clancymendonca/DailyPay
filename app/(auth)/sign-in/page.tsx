import AuthForm from '@/components/AuthForm'

const SignIn = ({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) => {
  return (
    <section className="flex-center size-full max-sm:px-6">
      <AuthForm type="sign-in" redirect={searchParams.redirect} />
    </section>
  )
}

export default SignIn
