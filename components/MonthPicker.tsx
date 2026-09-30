'use client';
import {useRouter,usePathname} from 'next/navigation';
export default function MonthPicker({month}:{month:string}){const router=useRouter();const path=usePathname();return <label className="month-control">Viewing month<input type="month" aria-label="Month" value={month.slice(0,7)} onChange={e=>{if(e.target.value)router.push(`${path}?month=${e.target.value}`);}}/></label>;}
