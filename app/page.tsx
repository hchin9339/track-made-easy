import {snapshot} from '@/lib/data';
import {selectedMonth} from '@/lib/format';
import Dashboard from '@/components/Dashboard';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{month?:string}>}){const month=selectedMonth((await searchParams).month);return <Dashboard data={await snapshot(month)} month={month}/>;}
