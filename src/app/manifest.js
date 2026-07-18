export default function manifest() {
  return {
    name: 'Easy Mess - Smart Mess Management System',
    short_name: 'EasyMess',
    description: 'Automate meals, bazaar, expenses, and billing for hostels, bachelor messes, and shared living.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon1.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
