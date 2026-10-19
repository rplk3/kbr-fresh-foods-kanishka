import { useState } from 'react';
import Layout from '../components/Layout';
import HeroSlider from '../components/HeroSlider';
import { contactApi } from '../api/services';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Loader } from 'lucide-react';

// Hero slider images — fresh foods & customer connection (unique to Contact)
const CONTACT_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1600&q=85',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await contactApi.send(form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero with sliding images */}
      <HeroSlider
        images={CONTACT_HERO_IMAGES}
        badge={{ icon: <Mail size={14} className="text-brand-300" />, text: 'Get in Touch' }}
        title="Contact KBR Fresh Foods"
        subtitle="Have a question about our products, wholesale orders, or delivery? We're here to help."
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Our Details</h2>

          {[
            {
              icon: <MapPin size={20} />,
              title: 'Visit Us',
              lines: ['No11, Mirigama Road', 'Koppara Junction, Negombo'],
              link: 'https://www.google.com/maps/search/?api=1&query=No11,+Mirigama+Road,+Koppara+Junction,+Negombo',
              linkText: 'Get Directions →',
            },
            {
              icon: <Phone size={20} />,
              title: 'Call Us',
              lines: ['+94 77 977 9316', '+94 77 977 9316 (WhatsApp)'],
              link: 'tel:+94779779316',
              linkText: 'Call Now →',
            },
            {
              icon: <Mail size={20} />,
              title: 'Email Us',
              lines: ['info@kbrfreshfoods.lk', 'wholesale@kbrfreshfoods.lk'],
              link: 'mailto:info@kbrfreshfoods.lk',
              linkText: 'Send Email →',
            },
            {
              icon: <Clock size={20} />,
              title: 'Store Hours',
              lines: ['Mon – Sat: 6:00 AM – 8:00 PM', 'Sunday: 7:00 AM – 5:00 PM'],
            },
          ].map((info) => (
            <div key={info.title} className="bg-white rounded-3xl p-6 flex gap-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                {info.icon}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg mb-1">{info.title}</div>
                {info.lines.map((l) => <div key={l} className="text-gray-500 text-sm leading-relaxed">{l}</div>)}
                {info.link && (
                  <a href={info.link} target="_blank" rel="noopener noreferrer" className="inline-block text-brand-600 text-sm font-bold mt-2 hover:text-brand-800 transition-colors">
                    {info.linkText}
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Map embed */}
          <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm mt-8 aspect-video relative group">
            <div className="absolute inset-0 bg-brand-900/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              src="https://www.openstreetmap.org/export/embed.html?bbox=79.830,7.195,79.850,7.215&layer=mapnik&marker=7.205,79.840"
              title="KBR Fresh Foods Location"
              loading="lazy"
              className="absolute inset-0"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 md:p-12 relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />
            
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-8 relative z-10">Send Us a Message</h2>

            {success ? (
              <div className="flex flex-col items-center justify-center py-16 text-center relative z-10 animate-fade-in">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={48} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">Message Sent Successfully!</h3>
                <p className="text-gray-500 max-w-sm text-lg leading-relaxed mb-8">
                  Thank you for contacting us. We'll get back to you within 24 hours. Check your inbox for a confirmation email.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="bg-gray-100 text-gray-700 font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="your@email.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone (optional)</label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+\s-]/g, '') })}
                      placeholder="+94 77 000 0000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition shadow-sm cursor-pointer appearance-none"
                    >
                      <option value="">Select a subject</option>
                      <option value="General Enquiry">General Enquiry</option>
                      <option value="Wholesale / Bulk Order">Wholesale / Bulk Order</option>
                      <option value="Delivery Issue">Delivery Issue</option>
                      <option value="Product Quality">Product Quality</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Tell us how we can help you..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition shadow-sm resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-5 py-4 rounded-2xl flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 disabled:bg-brand-400 text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 mt-4"
                >
                  {loading ? (
                    <><Loader size={18} className="animate-spin" /> Sending Message...</>
                  ) : (
                    <><Send size={18} /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
