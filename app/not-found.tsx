import Link from 'next/link';
export default function NotFound(){return <section className="panel empty"><h1>Record not found</h1><p>This expense may have been removed.</p><Link className="button" href="/expenses">Back to expenses</Link></section>;}
