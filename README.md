# آروان | Arevan

MVP یک پلتفرم محتوایی فارسی و مستقل با تمرکز بر مالیات، دادرسی مالیاتی، حسابداری، حسابرسی و دانش مالی کاربردی. هویت عمومی پروژه «آروان» است و هیچ اطلاعات شناسایی‌کننده‌ای از نویسندگان خصوصی در خروجی عمومی منتشر نمی‌شود.

## محدوده فعلی

- صفحه اصلی و هویت برند آروان
- کتابخانه مقالات و صفحات موضوعی
- جستجوی فارسی در عنوان، خلاصه، دسته‌بندی و متن مقاله
- صفحه «درباره آروان» با رویکرد انتشاراتی
- نویسندگی عمومی با عنوان «تحریریه آروان»
- پوسته مدیریت مقالات، دسته‌بندی‌ها و تنظیمات برند
- اتصال واقعی پنل مقاله به PostgreSQL: پیش‌نویس، انتشار، ویرایش و متادیتای SEO
- احراز هویت برنامه‌ای پنل مدیریت با رمز هش‌شده و session cookie امن
- خواندن مقالات منتشرشده از دیتابیس در صفحه اصلی، کتابخانه، دسته‌بندی، جست‌وجو و صفحات مقاله
- ISR با `revalidate` پنج دقیقه‌ای و invalidation فوری مسیرها بعد از ذخیره یا انتشار مقاله
- metadata، Open Graph، JSON-LD برای Organization، Article و BreadcrumbList، sitemap و robots
- RTL، طراحی واکنش‌گرا، Docker و خروجی standalone برای استقرار قابل حمل

## اجرا

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

### PostgreSQL با Docker Compose

برای ساخت دیتابیس محلی و ابزار مدیریت آن:

```bash
copy .env.docker.example .env.docker
docker compose --env-file .env.docker up -d postgres adminer
```

سپس در `.env.local` مقدار اتصال را قرار دهید:

```env
DATABASE_URL=postgresql://arevan:arevan_dev_password@localhost:5432/arevan
```

مهاجرت و داده نمونه را اجرا کنید:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

پنل مدیریت دیتابیس Adminer در [http://localhost:8080](http://localhost:8080) در دسترس است. در فرم ورود Adminer، مقدار `Server` را `postgres`، نام کاربری را `arevan`، رمز را `arevan_dev_password` و دیتابیس را `arevan` وارد کنید.

نکته: فایل `.env` پیش‌فرض Compose است و نباید شامل `ADMIN_PASSWORD_HASH` باشد؛ علامت `$` در هش scrypt توسط Compose به‌عنوان interpolation تفسیر می‌شود. رازهای برنامه را در `.env.local` نگه دارید و سرویس‌ها را با `--env-file .env.docker` اجرا کنید.

برای توقف سرویس‌ها:

```bash
docker compose down
```

برای حذف دیتابیس محلی و volume آن:

```bash
docker compose down -v
```

برای PostgreSQL مقدار `DATABASE_URL` را تنظیم کنید، سپس `pnpm db:generate && pnpm db:migrate && pnpm db:seed` را اجرا کنید. Drizzle از PostgreSQL استاندارد استفاده می‌کند و وابستگی به سرویس اختصاصی Cloudflare ندارد.

پنل داخلی در مسیر `/admin/articles` قرار دارد. فرم مقاله با Server Action به جدول `articles` می‌نویسد؛ وضعیت `draft` در سایت عمومی نمایش داده نمی‌شود و وضعیت `published` در اولین درخواست یا پس از invalidation وارد کش ISR می‌شود. پس از هر ذخیره، مسیرهای عمومی، جست‌وجو و sitemap با `revalidatePath` به‌روزرسانی می‌شوند.

### تنظیم ورود مدیر

یک رمز هش‌شده بسازید و دو مقدار زیر را در `.env.local` قرار دهید:

```bash
pnpm admin:hash -- your-strong-password
```

خروجی دستور را به‌عنوان `ADMIN_PASSWORD_HASH` قرار دهید و برای `ADMIN_SESSION_SECRET` یک مقدار تصادفی طولانی (حداقل ۳۲ کاراکتر) بگذارید. سپس مسیر `/admin/login` را باز کنید. session در cookieی HttpOnly با عمر ۸ ساعت ذخیره می‌شود و تمام مسیرهای `/admin` به‌جز صفحه ورود توسط middleware محافظت می‌شوند.

صفحات عمومی `revalidate = 300` دارند: در حالت عادی از خروجی cache شده و سریع سرو می‌شوند، و بعد از پایان بازه با اولین درخواست دوباره از PostgreSQL تولید می‌شوند. انتشار یا ویرایش از پنل invalidation فوری انجام می‌دهد و لازم نیست پنج دقیقه صبر کنید.

## معماری و توسعه آینده

رکورد نویسنده در مدل داده عمداً عمومی و قابل توسعه است: امروز `arevan-editorial` منتشر می‌شود و در آینده می‌توان نویسندگان نام‌دار را بدون تغییر معماری مقاله اضافه کرد. منطق دامنه به Cloudflare وابسته نیست؛ پروژه برای Node.js، Docker/Linux، VPS و PostgreSQL معمولی آماده نگه داشته شده است.

## استقرار

`Dockerfile` خروجی standalone Next.js را اجرا می‌کند. برای Cloudflare، از آداپتر رسمی Next.js محیط مقصد استفاده کنید و `DATABASE_URL` را به‌صورت secret تنظیم کنید. اطلاعات زیرساختی و هویت خصوصی نباید در متادیتا، seed یا خروجی عمومی وارد شوند.

## Cloudflare deployment

Cloudflare Workers deployment is documented in [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md). The project remains portable: local development and Docker/Linux use standard Next.js and PostgreSQL, while the Cloudflare target uses vinext and Hyperdrive for a hosted PostgreSQL database. Keep production secrets in Cloudflare Worker secrets and never commit `.env.local`.
