export const metadata = {
  title: "About Us",
  description: "Learn more about EasyMess, a digital platform dedicated to simplifying and automating mess management for bachelors, students, and hostels.",
  keywords: ["About EasyMess", "Mess Management Software BD", "Hostel Meal Tracker Team"],
  alternatives: {
    canonical: "https://easymess.vercel.app/about",
  },
};

import React from 'react'
import { cookies } from 'next/headers'
import { translations } from '@/lib/translations'

const page = async () => {
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value || 'en';
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  return (
    <div>
      <div className="flex justify-center items-center h-[60vh] w-full">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{t('underConstruction')}</h2>
          <p className="text-gray-500 mt-2">{t('checkBackSoon')}</p>
        </div>
      </div>
    </div>
  )
}

export default page
