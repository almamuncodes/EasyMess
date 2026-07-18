export const metadata = {
  title: "Features",
  description: "Explore the core features of EasyMess: automatic meal tracking, bazaar expense log, deposit summary, and monthly bill reports.",
  keywords: ["Meal Management Features", "Mess Expense Tracker", "Mess Bill Calculator", "Hostel Software features"],
  alternatives: {
    canonical: "https://easymess.vercel.app/features",
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
