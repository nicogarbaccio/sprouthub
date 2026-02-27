import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CascadingContainer } from "@/components/ui/cascading-container";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      <Navigation />

      <main className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <CascadingContainer delay={0}>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground">
                Last Updated: January 2, 2026
              </p>
            </div>
          </CascadingContainer>

          <CascadingContainer delay={100}>
            <Card>
              <CardContent className="prose prose-sm sm:prose dark:prose-invert max-w-none pt-6 space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
                  <p className="text-muted-foreground">
                    Welcome to sprouthub ("we," "our," or "us"). We are
                    committed to protecting your privacy and handling your data
                    in an open and transparent manner. This Privacy Policy
                    explains how we collect, use, store, and share your
                    information when you use our plant care application.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Information We Collect
                  </h2>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    Account Information
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    When you create an account, we collect:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Email address</li>
                    <li>Password (encrypted and securely stored)</li>
                    <li>Display name (optional)</li>
                    <li>Profile photo (optional)</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    Plant Care Data
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    To provide our plant care services, we store:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Plant names and types</li>
                    <li>Photos you upload of your plants</li>
                    <li>Watering schedules and history</li>
                    <li>Room/location information</li>
                    <li>Custom care notes and observations</li>
                    <li>Household sharing preferences</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    Location Data
                  </h3>
                  <p className="text-muted-foreground">
                    We collect your approximate location (city-level) to provide
                    weather-based watering recommendations. We do not track your
                    precise GPS location or store location history.
                  </p>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    Usage Information
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    We automatically collect:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Device type and operating system</li>
                    <li>App interactions and feature usage</li>
                    <li>Error logs and crash reports</li>
                    <li>Analytics data to improve our services</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    Push Notification Tokens
                  </h3>
                  <p className="text-muted-foreground">
                    If you enable push notifications, we store your device token
                    to send you watering reminders and important updates. You
                    can disable notifications at any time in your device
                    settings or app preferences.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    How We Use Your Information
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    We use your information to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      Provide and maintain the sprouthub app and its features
                    </li>
                    <li>
                      Generate personalized watering schedules based on weather
                      and seasons
                    </li>
                    <li>Send you watering reminders and notifications</li>
                    <li>
                      Enable household sharing and multi-user plant management
                    </li>
                    <li>Improve our services and develop new features</li>
                    <li>Analyze app usage patterns and performance</li>
                    <li>Detect, prevent, and address technical issues</li>
                    <li>
                      Communicate with you about updates, security alerts, and
                      support
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Third-Party Services
                  </h2>
                  <p className="text-muted-foreground mb-3">
                    To provide our services, we integrate with the following
                    third-party providers:
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Supabase (Database & Authentication)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Stores your account information, plant data, and
                        watering records securely.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        Cloudinary (Image Storage)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Hosts and optimizes plant photos you upload to the app.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        OpenWeather API
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Provides real-time weather data for your location to
                        adjust watering schedules.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        OneSignal (Push Notifications)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Delivers watering reminders and app notifications to
                        your device.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        Sentry (Error Tracking)
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        Monitors app crashes and errors to help us improve app
                        stability. Only error data is sent, no personal
                        information.
                      </p>
                    </div>
                  </div>

                  <p className="text-muted-foreground mt-3">
                    These services have their own privacy policies governing
                    their use of your information. We recommend reviewing their
                    policies:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground text-sm space-y-1 mt-2">
                    <li>
                      Supabase:{" "}
                      <a
                        href="https://supabase.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sprout-primary hover:underline"
                      >
                        supabase.com/privacy
                      </a>
                    </li>
                    <li>
                      Cloudinary:{" "}
                      <a
                        href="https://cloudinary.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sprout-primary hover:underline"
                      >
                        cloudinary.com/privacy
                      </a>
                    </li>
                    <li>
                      OpenWeather:{" "}
                      <a
                        href="https://openweather.co.uk/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sprout-primary hover:underline"
                      >
                        openweather.co.uk/privacy-policy
                      </a>
                    </li>
                    <li>
                      OneSignal:{" "}
                      <a
                        href="https://onesignal.com/privacy_policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sprout-primary hover:underline"
                      >
                        onesignal.com/privacy_policy
                      </a>
                    </li>
                    <li>
                      Sentry:{" "}
                      <a
                        href="https://sentry.io/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sprout-primary hover:underline"
                      >
                        sentry.io/privacy
                      </a>
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
                  <p className="text-muted-foreground mb-2">
                    We take the security of your data seriously and implement
                    industry-standard protections:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      All data is transmitted over encrypted HTTPS connections
                    </li>
                    <li>Passwords are encrypted using bcrypt hashing</li>
                    <li>
                      Row-level security ensures you can only access your own
                      plant data
                    </li>
                    <li>Regular security updates and monitoring</li>
                    <li>Limited employee access to user data</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    However, no method of transmission over the internet or
                    electronic storage is 100% secure. While we strive to use
                    commercially acceptable means to protect your information,
                    we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Data Retention
                  </h2>
                  <p className="text-muted-foreground">
                    We retain your personal information and plant data for as
                    long as your account is active. If you delete your account,
                    we will permanently delete your data within 30 days, except
                    where we are required by law to retain certain information.
                    You can request account deletion at any time through the app
                    settings or by contacting us.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
                  <p className="text-muted-foreground mb-2">
                    You have the right to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      <strong>Access:</strong> Request a copy of your personal
                      data
                    </li>
                    <li>
                      <strong>Correction:</strong> Update or correct inaccurate
                      information
                    </li>
                    <li>
                      <strong>Deletion:</strong> Request deletion of your
                      account and data
                    </li>
                    <li>
                      <strong>Export:</strong> Download your plant data in a
                      portable format
                    </li>
                    <li>
                      <strong>Opt-out:</strong> Disable push notifications and
                      marketing communications
                    </li>
                    <li>
                      <strong>Object:</strong> Object to certain data processing
                      activities
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    To exercise any of these rights, please contact us at the
                    email address provided below.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Children's Privacy
                  </h2>
                  <p className="text-muted-foreground">
                    sprouthub is not intended for use by children under the age
                    of 13. We do not knowingly collect personal information from
                    children under 13. If we become aware that we have collected
                    personal information from a child under 13, we will take
                    steps to delete such information promptly.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    International Data Transfers
                  </h2>
                  <p className="text-muted-foreground">
                    Your information may be transferred to and processed in
                    countries other than your country of residence. These
                    countries may have data protection laws that are different
                    from the laws of your country. By using sprouthub, you
                    consent to the transfer of your information to our
                    facilities and third-party service providers.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    California Privacy Rights (CCPA)
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    If you are a California resident, you have additional rights
                    under the California Consumer Privacy Act (CCPA):
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      Right to know what personal information is collected,
                      used, shared, or sold
                    </li>
                    <li>Right to delete personal information</li>
                    <li>
                      Right to opt-out of the sale of personal information
                      (Note: We do not sell your personal information)
                    </li>
                    <li>
                      Right to non-discrimination for exercising your rights
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    European Privacy Rights (GDPR)
                  </h2>
                  <p className="text-muted-foreground">
                    If you are located in the European Economic Area (EEA), you
                    have rights under the General Data Protection Regulation
                    (GDPR), including the right to access, rectify, erase, and
                    restrict processing of your personal data, as well as the
                    right to data portability and to object to processing.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Changes to This Privacy Policy
                  </h2>
                  <p className="text-muted-foreground">
                    We may update this Privacy Policy from time to time. We will
                    notify you of any changes by posting the new Privacy Policy
                    on this page and updating the "Last Updated" date. We
                    encourage you to review this Privacy Policy periodically for
                    any changes. Your continued use of the app after changes are
                    posted constitutes your acceptance of the updated policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
                  <p className="text-muted-foreground mb-2">
                    If you have any questions about this Privacy Policy or our
                    data practices, please contact us at:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold text-foreground">sprouthub</p>
                    <p className="text-muted-foreground">
                      Email: nico@sprouthub.app
                      <a
                        href="mailto:privacy@sprouthub.app"
                        className="text-sprout-primary hover:underline"
                      >
                        nico@sprouthub.app
                      </a>
                    </p>
                  </div>
                </section>

                <section className="border-t pt-6 mt-6">
                  <h2 className="text-2xl font-semibold mb-3">
                    Summary of Key Points
                  </h2>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      We collect only the information necessary to provide our
                      plant care services
                    </li>
                    <li>We never sell your personal data to third parties</li>
                    <li>
                      Your plant data is private and secured with row-level
                      security
                    </li>
                    <li>You can delete your account and data at any time</li>
                    <li>
                      We use trusted third-party services to enhance
                      functionality
                    </li>
                    <li>
                      You have full control over your notifications and data
                    </li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </CascadingContainer>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
