import Link from "next/link";
import { Heart, CheckCircle, Users, Calendar, PoundSterling, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-champagne-50 via-white to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="font-serif text-xl font-semibold">Wedding Planner</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-semibold max-w-3xl mx-auto leading-tight">
            Plan your perfect day with{" "}
            <span className="text-primary">calm & clarity</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            A beautifully simple wedding planner that keeps you organised without the overwhelm. 
            Tasks, guests, budget, vendors — all in one elegant place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Start Planning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <CheckCircle className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-serif text-lg font-semibold">Tasks & Checklists</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Never miss a deadline with organised tasks and smart reminders.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <Users className="h-10 w-10 text-sage-500 mb-4" />
              <h3 className="font-serif text-lg font-semibold">Guest Management</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Track RSVPs, dietary requirements, and seating all in one place.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <PoundSterling className="h-10 w-10 text-champagne-600 mb-4" />
              <h3 className="font-serif text-lg font-semibold">Budget Tracking</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Stay on top of costs with clear budget categories and payment tracking.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <Calendar className="h-10 w-10 text-rose-400 mb-4" />
              <h3 className="font-serif text-lg font-semibold">Timeline</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Visualise your journey from engagement to the big day.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white border-y py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif font-semibold">
              Designed for couples, not corporations
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              No bloat. No overwhelming dashboards. Just a calm, structured space 
              to plan the most important day of your life.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sage-500" />
                UK date & currency formats
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sage-500" />
                Role-based permissions
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sage-500" />
                Vendor spend protection
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sage-500" />
                Mobile responsive
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-serif font-semibold">
            Ready to start planning?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Create your free account and begin your wedding journey today.
          </p>
          <Link href="/login">
            <Button size="lg" className="mt-8 gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-4 w-4 text-primary fill-primary" />
            <span className="font-serif font-medium">Wedding Planner</span>
          </div>
          <p>Made with love for couples planning their perfect day.</p>
        </div>
      </footer>
    </div>
  );
}
