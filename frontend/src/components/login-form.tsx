'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { signIn } from 'next-auth/react'
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'

  const [isLoading, setIsLoading] = useState<{
    github: boolean;
    google: boolean;
  }>({ github: false, google: false });

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(prev => ({ ...prev, [provider]: true }));
      const result = await signIn(provider, {
        callbackUrl,
        redirect: true,
      });

      if (result?.error) {
        toast.error(`Failed to sign in with ${ provider }`);
      }
    } catch (error) {
      toast.error(`An error occurred while signing in with ${ provider }`);
    } finally {
      setIsLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your GitHub or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={isLoading.github}
                  variant="outline"
                  className="w-full flex space-x-2">
                 <FaGithub className="h-5 w-5" />
                  <span>Login with GitHub</span>
                </Button>
                <Button
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading.google}
                  variant="outline"
                  className="w-full flex space-x-2">
                  <FcGoogle className="h-5 w-5" />
                  <span>Login with Google</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="#" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
