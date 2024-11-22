import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AuthFormData = {
  email: string;
  name?: string;
  password: string;
};

export default function AuthPage() {
  const { login, register } = useUser();
  const [isRegister, setIsRegister] = useState(false);
  const { toast } = useToast();

  const form = useForm<AuthFormData>({
    defaultValues: {
      email: '',
      name: '',
      password: ''
    }
  });
  const { handleSubmit, formState: { isSubmitting } } = form;

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (!data.email.endsWith('@sfu.ca')) {
        toast({
          title: "Invalid Email",
          description: "Please use your SFU email address",
          variant: "destructive"
        });
        return;
      }

      const result = isRegister 
        ? await register({ ...data, name: data.name! }) 
        : await login(data);
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-green-800">
            SFU Prayer Connect
          </CardTitle>
          <CardDescription className="text-center">
            {isRegister ? "Create your account" : "Welcome back"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SFU Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="yourname@sfu.ca" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isRegister && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isRegister ? "Create Account" : "Login"}
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Already have an account?" : "Need an account?"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
