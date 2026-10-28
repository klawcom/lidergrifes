import { describe, expect, it } from 'vitest';
import { canUpdateCustomer, checkoutEmail, isStoreManager } from '@/lib/account-rules';
describe('Store access rules', () => {
 it('grants manager access only to the verified designated email with a server role',()=>{
  expect(isStoreManager('klaw.com@gmail.com',true,true)).toBe(true);
  expect(isStoreManager('klaw.com@gmail.com',false,true)).toBe(false);
  expect(isStoreManager('klaw.com@gmail.com',true,false)).toBe(false);
  expect(isStoreManager('other@example.com',true,true)).toBe(false);
 });
 it('uses the verified account email for customer linkage instead of supplied checkout email',()=>{
  expect(checkoutEmail('other@example.com','Customer@Example.com')).toBe('customer@example.com');
 });
 it('allows checkout without an account',()=>{
  expect(checkoutEmail('Guest@Example.com',null)).toBe('guest@example.com');
 });
 it('prevents guest or another account from overwriting private customer details',()=>{
  expect(canUpdateCustomer('owner',null)).toBe(false);
  expect(canUpdateCustomer('owner','other')).toBe(false);
  expect(canUpdateCustomer('owner','owner')).toBe(true);
  expect(canUpdateCustomer(null,'owner')).toBe(true);
 });
});