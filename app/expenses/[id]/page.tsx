import Link from 'next/link';
import {notFound} from 'next/navigation';
import {database} from '@/lib/data';
import {money} from '@/lib/format';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[\da-f-]{36}$/i.test(id))notFound();
 const db=database();const {data:expense,error}=await db.from('expenses').select('*').eq('id',id).maybeSingle();
 if(error)throw new Error('Could not load expense.');if(!expense)notFound();
 const {data:category}=await db.from('categories').select('name').eq('id',expense.category_id).single();
 return <><Link href={`/expenses?month=${expense.month.slice(0,7)}`}>← Back to expenses</Link><header className="page-heading" style={{marginTop:28}}><div><p className="eyebrow">EXPENSE DETAIL</p><h1>{expense.vendor}</h1><p className="muted">{expense.description || 'No description provided'}</p></div><span className={`badge ${expense.status}`}>{expense.status==='actual'?'Actual · Approved':'Committed · Pending approval'}</span></header><section className="panel form-panel"><h2>{money(Number(expense.amount))}</h2><dl className="detail-grid"><div><dt>Category</dt><dd>{category?.name}</dd></div><div><dt>Expense date</dt><dd>{expense.expense_date}</dd></div><div><dt>Budget month</dt><dd>{expense.month.slice(0,7)}</dd></div><div><dt>Status</dt><dd>{expense.status}</dd></div><div className="wide"><dt>Notes</dt><dd style={{whiteSpace:'pre-wrap'}}>{expense.notes || 'No notes provided.'}</dd></div></dl><Link className="button secondary" href={`/expenses?month=${expense.month.slice(0,7)}`}>Manage expense →</Link></section></>;
}
