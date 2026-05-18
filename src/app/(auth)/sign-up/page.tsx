import Link from "next/link";
import { GitBranch, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground">Google или GitHub, без паролей</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/api/auth/signin/google">
              <Mail />
              Зарегистрироваться через Google
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/api/auth/signin/github">
              <GitBranch />
              Зарегистрироваться через GitHub
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/sign-in" className="font-medium text-primary">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
