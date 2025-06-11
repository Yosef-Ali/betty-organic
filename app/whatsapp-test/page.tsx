import WhatsAppCloudAPITester from '@/components/whatsapp/WhatsAppCloudAPITester'

export default function WhatsAppTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        WhatsApp Cloud API Integration Test
      </h1>
      <WhatsAppCloudAPITester />
      
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">📋 Setup Checklist</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span>1.</span>
            <span>Create Meta Developer Account and Facebook App</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>2.</span>
            <span>Add WhatsApp product to your app</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>3.</span>
            <span>Get temporary access token and phone number ID</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>4.</span>
            <span>Add test recipients (up to 5 phone numbers)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>5.</span>
            <span>Update .env.local with your credentials</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>6.</span>
            <span>Test the integration using this page</span>
          </div>
        </div>
      </div>
    </div>
  )
}
