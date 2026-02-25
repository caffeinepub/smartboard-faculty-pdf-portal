import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, GraduationCap, BookOpen, CheckCircle2, Pen, Users, KeyRound, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Faculty Management',
      description: 'Add faculty members and assign teaching materials to specific instructors.',
    },
    {
      icon: BookOpen,
      title: 'PDF Library',
      description: 'Upload and organize PDF teaching materials with easy assignment to faculty.',
    },
    {
      icon: Pen,
      title: 'Smart Annotations',
      description: 'Draw, highlight, and add text notes directly on PDFs during teaching sessions.',
    },
    {
      icon: CheckCircle2,
      title: 'Teaching Tracker',
      description: 'Track which materials have been taught and monitor teaching progress.',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-foreground/10 mb-4">
            <img
              src="/assets/generated/eduboard-logo.dim_256x256.png"
              alt="EduBoard"
              className="h-14 w-14 object-contain"
            />
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight">
            Smart Board Faculty Portal
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            A powerful teaching platform for smart boards. Upload PDFs, annotate during lessons,
            and track your teaching progress — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => navigate({ to: '/admin' })}
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Admin Panel
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate({ to: '/faculty' })}
            >
              <GraduationCap className="h-5 w-5 mr-2" />
              Faculty Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Admin Login Credentials Notice */}
      <section className="py-8 px-4 bg-accent/5 border-b border-border">
        <div className="container mx-auto max-w-2xl">
          <Alert className="border-accent/40 bg-accent/10">
            <KeyRound className="h-5 w-5 text-accent" />
            <AlertTitle className="font-semibold text-foreground text-base">
              Default Admin Login Credentials
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p className="text-muted-foreground text-sm">
                Use the credentials below to access the Admin Panel for the first time. You can change them after logging in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 flex-1">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">Username:</span>
                  <code className="font-mono text-sm font-bold text-accent select-all">
                    admin
                  </code>
                </div>
                <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 flex-1">
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground font-medium">Password:</span>
                  <code className="font-mono text-sm font-bold text-accent select-all">
                    admin1234
                  </code>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                ⚠️ Change these credentials after your first login for security.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-center text-foreground mb-12">
            Everything You Need for Smart Teaching
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="bg-secondary/30 py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-foreground">Ready to Start?</h2>
          <p className="text-muted-foreground">
            Administrators can upload PDFs and manage faculty. Faculty members can access their
            assigned materials and start teaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => navigate({ to: '/admin' })}
              className="h-12 px-6 font-semibold"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Go to Admin Panel
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/faculty' })}
              className="h-12 px-6 font-semibold"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Go to Faculty Portal
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
