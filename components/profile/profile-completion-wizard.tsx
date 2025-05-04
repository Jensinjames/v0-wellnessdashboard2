"use client"

import { useState, useEffect } from "react"
import { useProfile } from "@/context/profile-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from "lucide-react"
import { BasicInfoForm } from "@/components/profile/basic-info-form"
import { ProfilePictureForm } from "@/components/profile/profile-picture-form"
import { PreferencesForm } from "@/components/profile/preferences-form"
import { NotificationsForm } from "@/components/profile/notifications-form"
import { AccessibilityForm } from "@/components/profile/accessibility-form"
import type { ProfileCompletionStep } from "@/types/profile"

export function ProfileCompletionWizard() {
  const { profile, completionStatus, isLoading } = useProfile()
  const [activeStep, setActiveStep] = useState<ProfileCompletionStep>("basic_info")
  const [isCompleting, setIsCompleting] = useState(false)

  // Initialize active step based on completion status
  useEffect(() => {
    if (completionStatus?.current_step) {
      setActiveStep(completionStatus.current_step)
    }
  }, [completionStatus])

  // Handle step navigation
  const goToNextStep = () => {
    const steps: ProfileCompletionStep[] = [
      "basic_info",
      "profile_picture",
      "preferences",
      "notifications",
      "accessibility",
    ]
    const currentIndex = steps.indexOf(activeStep)

    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1])
    } else {
      setIsCompleting(true)
    }
  }

  const goToPreviousStep = () => {
    const steps: ProfileCompletionStep[] = [
      "basic_info",
      "profile_picture",
      "preferences",
      "notifications",
      "accessibility",
    ]
    const currentIndex = steps.indexOf(activeStep)
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1])
    }
  }

  // Skip to completion
  const skipToCompletion = () => {
    setIsCompleting(true)
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Loading profile...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load profile information.</AlertDescription>
      </Alert>
    )
  }

  if (isCompleting || completionStatus?.is_complete) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Profile Setup Complete!</CardTitle>
          <CardDescription>
            Thank you for completing your profile setup. You can now access all features of the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle2 className="h-24 w-24 text-green-500 mb-4" />
          <p className="text-xl font-medium text-center">Your profile is now complete</p>
          <p className="text-muted-foreground text-center mt-2">
            You can always update your information in your profile settings.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Please complete your profile to get the most out of our application.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Progress value={completionStatus?.completion_percentage || 0} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{completionStatus?.completion_percentage || 0}% complete</p>
        </div>

        <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as ProfileCompletionStep)}>
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="basic_info">
              {completionStatus?.completed_steps.includes("basic_info") ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : null}
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="profile_picture">
              {completionStatus?.completed_steps.includes("profile_picture") ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : null}
              Picture
            </TabsTrigger>
            <TabsTrigger value="preferences">
              {completionStatus?.completed_steps.includes("preferences") ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : null}
              Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications">
              {completionStatus?.completed_steps.includes("notifications") ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : null}
              Notifications
            </TabsTrigger>
            <TabsTrigger value="accessibility">
              {completionStatus?.completed_steps.includes("accessibility") ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : null}
              Accessibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic_info">
            <BasicInfoForm onComplete={goToNextStep} />
          </TabsContent>

          <TabsContent value="profile_picture">
            <ProfilePictureForm onComplete={goToNextStep} />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesForm onComplete={goToNextStep} />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsForm onComplete={goToNextStep} />
          </TabsContent>

          <TabsContent value="accessibility">
            <AccessibilityForm onComplete={goToNextStep} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousStep} disabled={activeStep === "basic_info"}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button variant="ghost" onClick={skipToCompletion}>
          Skip for now
        </Button>
        <Button onClick={goToNextStep}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
