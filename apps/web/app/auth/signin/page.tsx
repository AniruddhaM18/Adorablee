import { LoginForm } from "@/components/login-form"

export default function SigninPage() {
  return (
    <div className="bg-neutral-950 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
