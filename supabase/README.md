# Supabase Database Migrations

This folder contains SQL migrations for the e-commerce store. The app uses **Supabase only** (auth, database, storage); there is no other backend or database.

## 📁 Migration Files (run in this order)

1. **20260209000000_complete_schema.sql** – Full schema: extensions, enums, tables, functions, triggers, RLS policies, storage buckets. Run this first on a new project.
2. **20260227000000_contact_submissions.sql** – Adds `contact_submissions` table for the store contact form. Run after the complete schema.

## 🚀 How to run

### Method 1: Supabase Dashboard (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Copy and run **20260209000000_complete_schema.sql** in full.
3. Copy and run **20260227000000_contact_submissions.sql** in full.

### Method 2: Supabase CLI

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## ⚠️ Migration order

1. ✅ 20260209000000_complete_schema.sql (creates all tables, RLS, triggers, storage)
2. ✅ 20260227000000_contact_submissions.sql (contact form table)
3. ✅ 20260315000000_admin_rls_products_categories.sql (admin CRUD policies for products/categories)
4. ✅ 20260318000000_full_rls_verification_and_fixes.sql (comprehensive RLS audit — fixes store_modules gap, ensures all policies exist)

### Security
- **RLS is enabled** on all tables
- **Users can only access their own data**
- **Products and blog posts are public**
- **Admin functions require authentication**

### Sample Data
- File `005_sample_data.sql` is **optional**
- Use for **testing and development only**
- **Delete or comment out** before production deployment

## 🔧 Customization

### Adding New Tables
Add to `001_initial_schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS your_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- your columns
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Adding RLS Policies
Add to `002_row_level_security.sql`:
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name"
  ON your_table FOR SELECT
  USING (auth.uid() = user_id);
```

### Adding Triggers
Add to `003_functions_and_triggers.sql`:
```sql
CREATE TRIGGER your_trigger
  BEFORE INSERT ON your_table
  FOR EACH ROW
  EXECUTE FUNCTION your_function();
```

## 📊 Database Schema Overview

### Core Tables
- **profiles** - User profile information
- **addresses** - Shipping and billing addresses
- **products** - Product catalog
- **product_variants** - Product options (size, color, etc.)
- **categories** - Product categories

### E-commerce Tables
- **orders** - Order information
- **order_items** - Products in each order
- **cart_items** - Shopping cart
- **wishlist_items** - User wishlists
- **reviews** - Product reviews and ratings

### Marketing Tables
- **coupons** - Discount codes
- **loyalty_points** - Customer loyalty program
- **loyalty_transactions** - Points history
- **blog_posts** - Content marketing

### Support Tables
- **support_tickets** - Customer support
- **support_messages** - Ticket conversations
- **return_requests** - Product returns
- **return_items** - Items being returned
- **notifications** - User notifications
- **contact_submissions** - Contact form (migration 20260227000000)

## 🔐 Default Policies

### User Data
✅ Users can view/edit their own profile  
✅ Users can manage their addresses  
✅ Users can view their orders  
✅ Users can manage their cart/wishlist  

### Public Data
✅ Anyone can view products  
✅ Anyone can view categories  
✅ Anyone can view blog posts  
✅ Anyone can view approved reviews  

### Protected Data
🔒 Orders are private  
🔒 Personal information is private  
🔒 Payment details are secure  
🔒 Admin functions require authentication  

## 🎯 Next Steps

After running migrations:

1. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Grant yourself admin: in SQL Editor run  
   `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`  
   (or use the “How to grant admin access” section on `/admin/login`).
3. Add products and content via the admin panel.

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/plpgsql.html)
- [Storage Policies](https://supabase.com/docs/guides/storage)

## 🆘 Troubleshooting

### Migration Fails
- Check if tables already exist
- Run migrations in correct order
- Check for syntax errors
- Verify Supabase connection

### RLS Issues
- Ensure policies are created
- Check user authentication
- Verify policy conditions
- Test with different users

### Trigger Problems
- Check function definitions
- Verify trigger timing (BEFORE/AFTER)
- Test with sample data
- Review error messages

## 💡 Tips

✅ **Always backup** before running migrations  
✅ **Test in development** environment first  
✅ **Review policies** before production  
✅ **Monitor performance** with indexes  
✅ **Document changes** for your team  

---

**Ready to deploy?** Link your Supabase project and run these migrations.
