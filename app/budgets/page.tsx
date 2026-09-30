import {snapshot} from '@/lib/data';
import {selectedMonth} from '@/lib/format';
import {Tracker} from '@/components/Tracker';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{month?:string}>}){const month=selectedMonth((await searchParams).month);return <Tracker data={await snapshot(month)} month={month} section="budgets"/>;}
