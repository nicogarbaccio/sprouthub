import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CascadingContainer } from "@/components/ui/cascading-container";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <CascadingContainer delay={0}>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Terms of Service
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
                  <h2 className="text-2xl font-semibold mb-3">
                    Acceptance of Terms
                  </h2>
                  <p className="text-muted-foreground">
                    Welcome to sprouthub. By accessing or using our mobile
                    application ("App"), you agree to be bound by these Terms of
                    Service ("Terms"). If you do not agree to these Terms,
                    please do not use the App. We reserve the right to modify
                    these Terms at any time, and your continued use of the App
                    constitutes acceptance of any changes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Description of Service
                  </h2>
                  <p className="text-muted-foreground">
                    sprouthub is a plant care management application that helps
                    users track watering schedules, monitor plant health, and
                    receive personalized care recommendations based on weather
                    data and seasonal patterns. The App provides features
                    including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Plant collection management and organization</li>
                    <li>Smart watering schedules with weather integration</li>
                    <li>Push notifications for watering reminders</li>
                    <li>Plant analytics and care history tracking</li>
                    <li>Household sharing for collaborative plant care</li>
                    <li>Access to a curated plant care catalog</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Account Registration
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    To use sprouthub, you must create an account. You agree to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      Provide accurate, current, and complete information during
                      registration
                    </li>
                    <li>
                      Maintain and promptly update your account information
                    </li>
                    <li>Maintain the security of your password and account</li>
                    <li>
                      Accept all responsibility for any activities that occur
                      under your account
                    </li>
                    <li>
                      Notify us immediately of any unauthorized use of your
                      account
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    You are solely responsible for all activity on your account.
                    We reserve the right to suspend or terminate accounts that
                    violate these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    User Conduct and Acceptable Use
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    You agree to use the App only for lawful purposes and in
                    accordance with these Terms. You agree NOT to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      Use the App in any way that violates any applicable
                      federal, state, local, or international law or regulation
                    </li>
                    <li>
                      Transmit any material that is unlawful, harmful,
                      threatening, abusive, harassing, defamatory, vulgar,
                      obscene, or otherwise objectionable
                    </li>
                    <li>
                      Impersonate or attempt to impersonate sprouthub, a
                      sprouthub employee, another user, or any other person or
                      entity
                    </li>
                    <li>
                      Engage in any conduct that restricts or inhibits anyone's
                      use or enjoyment of the App
                    </li>
                    <li>
                      Attempt to gain unauthorized access to any portion of the
                      App, other accounts, computer systems, or networks
                      connected to the App
                    </li>
                    <li>
                      Use any robot, spider, scraper, or other automated means
                      to access the App for any purpose without our express
                      written permission
                    </li>
                    <li>
                      Reverse engineer, decompile, or disassemble any portion of
                      the App
                    </li>
                    <li>
                      Upload or transmit viruses, malware, or any other
                      malicious code
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    User Content and Data
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    You retain all rights to the content you create and upload
                    to the App, including plant photos, notes, and custom care
                    information ("User Content"). By uploading User Content, you
                    grant sprouthub a limited, worldwide, non-exclusive,
                    royalty-free license to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Store and display your User Content within the App</li>
                    <li>
                      Process your User Content to provide App functionality
                    </li>
                    <li>
                      Back up your User Content for data recovery purposes
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    You represent and warrant that you own or have the necessary
                    rights to all User Content you upload, and that your User
                    Content does not violate any third-party rights or
                    applicable laws.
                  </p>
                  <p className="text-muted-foreground mt-3">
                    We reserve the right to remove any User Content that
                    violates these Terms or that we find objectionable for any
                    reason.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Intellectual Property Rights
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    The App and its entire contents, features, and functionality
                    (including but not limited to all information, software,
                    text, displays, images, video, and audio, and the design,
                    selection, and arrangement thereof) are owned by sprouthub,
                    its licensors, or other providers of such material and are
                    protected by United States and international copyright,
                    trademark, patent, trade secret, and other intellectual
                    property or proprietary rights laws.
                  </p>
                  <p className="text-muted-foreground mt-3">
                    You may not reproduce, distribute, modify, create derivative
                    works of, publicly display, publicly perform, republish,
                    download, store, or transmit any of the material on our App,
                    except as generally and ordinarily permitted through the App
                    according to these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Third-Party Services
                  </h2>
                  <p className="text-muted-foreground">
                    The App integrates with third-party services including
                    weather data providers, cloud storage services, and push
                    notification services. Your use of these third-party
                    services is subject to their respective terms and privacy
                    policies. We are not responsible for the content, accuracy,
                    or availability of third-party services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Disclaimers and Limitations
                  </h2>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    Plant Care Advice
                  </h3>
                  <p className="text-muted-foreground">
                    sprouthub provides general plant care guidance and
                    recommendations. However, plant care results may vary based
                    on numerous factors including but not limited to local
                    conditions, plant health, soil quality, and environmental
                    factors. We do not guarantee that following our
                    recommendations will result in healthy plants or prevent
                    plant damage or death.
                  </p>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    Weather Data Accuracy
                  </h3>
                  <p className="text-muted-foreground">
                    Weather data is provided by third-party services and may not
                    always be accurate or up-to-date. We are not responsible for
                    any issues arising from inaccurate weather information.
                  </p>

                  <h3 className="text-xl font-semibold mb-2 mt-4">
                    "As Is" and "As Available"
                  </h3>
                  <p className="text-muted-foreground">
                    THE APP IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS
                    WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                    INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
                    FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR
                    COURSE OF PERFORMANCE. SPROUTHUB DOES NOT WARRANT THAT THE
                    APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR
                    OTHER HARMFUL COMPONENTS.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Limitation of Liability
                  </h2>
                  <p className="text-muted-foreground">
                    TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO
                    EVENT SHALL SPROUTHUB, ITS AFFILIATES, DIRECTORS, EMPLOYEES,
                    AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                    SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                    WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR
                    OTHER INTANGIBLE LOSSES, RESULTING FROM:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
                    <li>
                      Your access to or use of or inability to use the App
                    </li>
                    <li>
                      Any conduct or content of any third party on the App
                    </li>
                    <li>Any content obtained from the App</li>
                    <li>
                      Unauthorized access, use, or alteration of your
                      transmissions or content
                    </li>
                    <li>Plant damage or death resulting from use of the App</li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES
                    EXCEED THE AMOUNT YOU HAVE PAID US IN THE PAST SIX MONTHS,
                    OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Indemnification
                  </h2>
                  <p className="text-muted-foreground">
                    You agree to defend, indemnify, and hold harmless sprouthub,
                    its affiliates, licensors, and service providers, and its
                    and their respective officers, directors, employees,
                    contractors, agents, licensors, suppliers, successors, and
                    assigns from and against any claims, liabilities, damages,
                    judgments, awards, losses, costs, expenses, or fees
                    (including reasonable attorneys' fees) arising out of or
                    relating to your violation of these Terms or your use of the
                    App.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Subscription and Payments
                  </h2>
                  <p className="text-muted-foreground">
                    sprouthub currently offers its services free of charge. We
                    reserve the right to introduce paid subscription plans or
                    premium features in the future. If we do introduce paid
                    features, we will provide advance notice and you will have
                    the option to subscribe or continue using any available free
                    features.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Service Availability
                  </h2>
                  <p className="text-muted-foreground">
                    We strive to provide continuous service availability, but we
                    do not guarantee that the App will be available at all
                    times. We may experience hardware, software, or other
                    problems or need to perform maintenance, resulting in
                    interruptions, delays, or errors. We reserve the right to
                    change, revise, update, suspend, discontinue, or otherwise
                    modify the App at any time without notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Account Termination
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    You may terminate your account at any time through the App
                    settings. Upon termination:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>
                      Your right to access and use the App will immediately
                      cease
                    </li>
                    <li>
                      Your User Content and account data will be deleted within
                      30 days
                    </li>
                    <li>
                      Some information may be retained for legal or regulatory
                      requirements
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-3">
                    We reserve the right to suspend or terminate your account if
                    you violate these Terms or engage in conduct that we
                    determine to be inappropriate or harmful to the App or other
                    users.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Governing Law and Dispute Resolution
                  </h2>
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance
                    with the laws of the United States, without regard to its
                    conflict of law provisions. Any disputes arising from these
                    Terms or your use of the App shall be resolved through
                    binding arbitration in accordance with the American
                    Arbitration Association's rules, except that either party
                    may seek injunctive or other equitable relief in any court
                    of competent jurisdiction.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Changes to Terms
                  </h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these Terms at any time. We
                    will provide notice of material changes by posting the
                    updated Terms on this page and updating the "Last Updated"
                    date. Your continued use of the App after changes are posted
                    constitutes your acceptance of the modified Terms. We
                    encourage you to review these Terms periodically.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">Severability</h2>
                  <p className="text-muted-foreground">
                    If any provision of these Terms is held to be invalid or
                    unenforceable, such provision shall be struck and the
                    remaining provisions shall be enforced to the fullest extent
                    under law.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">
                    Entire Agreement
                  </h2>
                  <p className="text-muted-foreground">
                    These Terms, together with our Privacy Policy, constitute
                    the entire agreement between you and sprouthub regarding
                    your use of the App and supersede all prior agreements and
                    understandings.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
                  <p className="text-muted-foreground mb-2">
                    If you have any questions about these Terms of Service,
                    please contact us at:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold text-foreground">sprouthub</p>
                    <p className="text-muted-foreground">
                      Email:{" "}
                      <a
                        href="mailto:support@sprouthub.app"
                        className="text-sprout-primary hover:underline"
                      >
                        nico@sprouthub.app
                      </a>
                    </p>
                  </div>
                </section>

                <section className="border-t pt-6 mt-6">
                  <h2 className="text-2xl font-semibold mb-3">
                    Acknowledgment
                  </h2>
                  <p className="text-muted-foreground">
                    BY USING THE APP, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE
                    TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
                  </p>
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

export default TermsOfService;
