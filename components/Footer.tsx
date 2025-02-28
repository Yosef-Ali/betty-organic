'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function Footer() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [prelimEmail, setPrelimEmail] = useState('');

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !message) {
      setStatus('Please fill in all fields.');
      return;
    }

    const mailtoLink = `mailto:info@bettysorganic.com?subject=Message from ${name}&body=Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0AMessage:%0D%0A${encodeURIComponent(
      message,
    )}`;
    window.location.href = mailtoLink;

    // Clear form
    setStatus('Opening email client...');
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => {
      setOpen(false);
      setStatus('');
    }, 2000);
  };

  const handleContactClick = () => {
    setEmail(prelimEmail);
    setOpen(true);
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto mb-8 mt-4 bg-[#ffc100]/90 backdrop-blur-md border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={prelimEmail}
              onChange={e => setPrelimEmail(e.target.value)}
              className="flex-1 max-w-[320px]"
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  size="default"
                  onClick={handleContactClick}
                  className="w-full sm:w-auto"
                >
                  Contact Us
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Contact Us</DialogTitle>
                  <DialogDescription>
                    You can also reach us by phone or visit our location.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={sendEmail}
                  className="space-y-4"
                  method="post"
                  encType="text/plain"
                >
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      required
                    />
                  </div>
                  {status && <p className="text-sm text-gray-500">{status}</p>}
                  <DialogFooter>
                    <Button type="submit">Send Message</Button>
                  </DialogFooter>
                </form>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>info@bettysorganic.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>+251 91 234 5678</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Addis Ababa, Ethiopia</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <footer className="bg-[#ffc600]/90 backdrop-blur-md py-12 px-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-800">
            {/* Brand Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Betty's Organic</h3>
              <p className="text-sm">
                Fresh, organic produce delivered straight to your door.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  <span>+251 91 234 5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span>info@bettysorganic.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>Addis Ababa, Ethiopia</span>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold">
                  For Inquiries and Support
                </h4>
                <p className="text-sm">
                  Please contact us via email or phone for prompt assistance.
                </p>
              </div>
            </div>

            {/* Social & Legal */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Follow Us</h4>
              <div className="flex gap-4">
                {/* Replace these with your actual social media links */}
                <a href="https://twitter.com" className="hover:text-yellow-600">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  className="hover:text-yellow-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  className="hover:text-yellow-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
              </div>

              <div className="text-sm">
                <p>&copy; {new Date().getFullYear()} Betty&apos;s Organic</p>
                <p>All rights reserved</p>
                <p className="text-xs mt-2">
                  Developed by Yosef Ali{' '}
                  <a
                    href="mailto:mekdesyared@gmail.com"
                    className="hover:text-yellow-600"
                  >
                    dev.yosefali@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
