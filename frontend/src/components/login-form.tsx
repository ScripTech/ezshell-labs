'use client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FaGithub } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { signIn } from 'next-auth/react'
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const message = searchParams.get('message')

  const [isLoading, setIsLoading] = useState<{
    github: boolean;
    google: boolean;
    credentials: boolean;
  }>({ github: false, google: false, credentials: false });

  const [credentialsForm, setCredentialsForm] = useState({
    email: '',
    password: '',
  });

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(prev => ({ ...prev, [provider]: true }));
      const result = await signIn(provider, {
        callbackUrl: callbackUrl === '/' ? '/user/dashboard' : callbackUrl,
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

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentialsForm.email || !credentialsForm.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, credentials: true }));

      const result = await signIn('credentials', {
        email: credentialsForm.email,
        password: credentialsForm.password,
        callbackUrl: callbackUrl === '/' ? '/user/dashboard' : callbackUrl,
        redirect: true, // Let NextAuth handle the redirect
      });

      // This code may not execute if redirect is true and successful
      if (result?.error) {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('An error occurred during sign in');
    } finally {
      setIsLoading(prev => ({ ...prev, credentials: false }));
    }
  };  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentialsForm({
      ...credentialsForm,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
          {message === 'setup-complete' && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              Setup complete! You can now sign in with your admin credentials.
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Credentials Login Form */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={credentialsForm.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentialsForm.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading.credentials}
              >
                {isLoading.credentials ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* OAuth Login Buttons */}
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
              Need to set up admin access?{" "}
              <a href="/auth/setup" className="underline underline-offset-4">
                Admin Setup
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
