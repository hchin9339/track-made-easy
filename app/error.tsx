'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="panel empty"><h1>We couldn’t load your workspace</h1><p>Check your connection and try again. If this continues, the database configuration may need attention.</p><button onClick={reset}>Try again</button></section>;}
