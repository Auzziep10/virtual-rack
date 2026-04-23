import React from 'react'
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white tracking-tight">The Virtual Rack</h1>
          <p className="text-neutral-500 mt-2 text-sm uppercase tracking-widest">Merchant & Client Access</p>
        </div>

        <Card className="bg-neutral-900 border-neutral-800 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-medium tracking-wide">Authentication</CardTitle>
            <CardDescription className="text-neutral-400">
              Enter your email below to login to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="email" className="text-neutral-300">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="e.g. client@virtualrack.ai" 
                    required 
                    className="bg-neutral-950 border-neutral-800 focus:border-neutral-600 focus-visible:ring-0"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="password" className="text-neutral-300">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    className="bg-neutral-950 border-neutral-800 focus:border-neutral-600 focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <Button formAction={login} className="w-full bg-white text-black hover:bg-neutral-200">
                  Sign In
                </Button>
                <Button formAction={signup} variant="outline" className="w-full border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white">
                  Create Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
