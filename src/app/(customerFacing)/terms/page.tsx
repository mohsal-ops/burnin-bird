import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata("terms");

export default function TermsAndPolicies() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms and Policies</h1>

        {/* Terms of Service */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms of Service</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using The Wagon Wheel restaurant website and services, you agree to be bound by these terms and conditions.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>All orders are subject to acceptance and availability</li>
            <li>Prices are subject to change without notice</li>
            <li>We reserve the right to refuse service</li>
            <li>All menu items and descriptions are subject to availability</li>
          </ul>
        </section>

        {/* Privacy Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We are committed to protecting your privacy and ensuring you have a positive experience on our website.
          </p>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Information We Collect</h3>
          <p className="text-gray-700 mb-4">
            We may collect personal information including name, email, phone number, and order details when you interact with our services.
          </p>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">How We Use Your Information</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>To process and fulfill your orders</li>
            <li>To communicate with you about your orders</li>
            <li>To improve our services</li>
            <li>To send promotional information (with your consent)</li>
          </ul>
        </section>

        {/* Disclaimer */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
          <p className="text-gray-700 mb-4">
            The information provided on this website is for informational purposes only. The Wagon Wheel makes no representations or warranties of any kind regarding the accuracy or completeness of the content.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
          <p className="text-gray-700">
            In no event shall The Wagon Wheel be liable for any indirect, incidental, special, or consequential damages arising from your use of this website or services.
          </p>
        </section>

        {/* Contact */}
        <section className="border-t pt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about these terms and policies, please contact us at support@thewagonwheel.co
          </p>
        </section>
      </div>
    </div>
  );
}
