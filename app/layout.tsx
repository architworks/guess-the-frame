import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Guess the Movie — Your living room. The big screen.',description:'A little picture. A big movie moment. Gather your people for an AI-powered movie guessing night.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
