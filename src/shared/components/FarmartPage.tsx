import React from 'react'
import { Heart, Leaf, Search, ShoppingBag, Star, User, Menu, ChevronDown, Truck } from 'lucide-react'

/**
 * A static, deterministic stand-in for a Botble Farmart homepage.
 * It renders identically every time, so the burst effect can draw
 * several clipped copies of it as shards that line up perfectly.
 */
export function FarmartPage() {
  return (
    <div className="h-full w-full overflow-hidden bg-white text-ink select-none">
      <div className="bg-farm-dark text-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <Truck className="size-3.5" /> Free delivery on orders over $50
          </span>
          <span className="hidden whitespace-nowrap sm:inline">Need help? +1 800 555 0199</span>
        </div>
      </div>

      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:gap-8 sm:px-6">
          <button className="md:hidden" aria-label="Menu">
            <Menu className="size-6" />
          </button>
          <a className="flex items-center gap-2 whitespace-nowrap">
            <span className="grid size-9 place-items-center rounded-full bg-farm text-white">
              <Leaf className="size-5" />
            </span>
            <span className="text-2xl font-bold tracking-tight">Farmart</span>
          </a>
          <div className="hidden min-w-0 flex-1 items-center rounded-md border-2 border-farm md:flex">
            <span className="flex items-center gap-1 whitespace-nowrap border-r border-line px-4 text-sm text-muted">
              All categories <ChevronDown className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate px-4 py-2.5 text-sm text-muted">
              Search for fresh produce, dairy, bakery…
            </span>
            <span className="grid h-11 w-12 place-items-center bg-farm text-white">
              <Search className="size-5" />
            </span>
          </div>
          <div className="ml-auto flex items-center gap-5 md:ml-0">
            <Heart className="hidden size-6 text-ink sm:block" />
            <User className="hidden size-6 text-ink sm:block" />
            <span className="relative">
              <ShoppingBag className="size-6" />
              <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-sun text-[10px] font-bold text-ink">
                3
              </span>
            </span>
            <span className="hidden whitespace-nowrap text-sm font-semibold lg:block">$42.80</span>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-7xl items-center gap-8 px-6 pb-3 text-sm font-medium md:flex">
          <span className="flex items-center gap-2 whitespace-nowrap rounded-md bg-farm px-4 py-2.5 text-white">
            <Menu className="size-4" /> Browse categories
          </span>
          {['Home', 'Shop', 'Vendors', 'Recipes', 'Blog', 'Contact'].map((l) => (
            <span key={l} className="whitespace-nowrap">
              {l}
            </span>
          ))}
          <span className="ml-auto whitespace-nowrap text-farm">Weekly deals</span>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
        <section className="relative overflow-hidden rounded-xl bg-[#c9d4bf]">
          <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover object-right" draggable={false} />
          <div className="relative max-w-md px-6 py-10 sm:px-12 sm:py-16">
            <p className="text-sm font-semibold text-farm-dark">Organic & local</p>
            <h1 className="mt-2 text-3xl leading-tight font-bold sm:text-5xl">
              Farm-fresh vegetables, delivered tomorrow
            </h1>
            <p className="mt-3 max-w-xs text-sm text-ink/70 sm:text-base">
              From 120+ local growers. Picked this morning, at your door by 9am.
            </p>
            <span className="mt-6 inline-block rounded-md bg-farm px-6 py-3 text-sm font-semibold text-white">
              Shop now
            </span>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold sm:text-2xl">Best sellers this week</h2>
            <span className="text-sm font-medium text-farm">View all</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {PRODUCTS.map((p) => (
              <article key={p.name} className="rounded-lg border border-line p-3 sm:p-4">
                <div className="relative aspect-square overflow-hidden rounded-md bg-[#f7f5ef]">
                  <img src={p.img} alt="" className="h-full w-full object-cover" draggable={false} />
                  {p.sale && (
                    <span className="absolute top-2 left-2 rounded bg-tomato px-2 py-0.5 text-[11px] font-bold text-white">
                      {p.sale}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted">{p.vendor}</p>
                <h3 className="mt-0.5 truncate text-sm font-semibold">{p.name}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Star className="size-3.5 fill-sun text-sun" /> {p.rating}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-bold text-farm-dark">{p.price}</span>
                  <span className="rounded-md bg-farm-soft px-3 py-1.5 text-xs font-semibold text-farm-dark">Add</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

const HERO = 'https://cdn.magicpatterns.com/patterns/generated-images/e5fe2c3d-692f-4ad4-9a09-1a4e272c916c.jpg'

const PRODUCTS = [
  {
    name: 'Vine-ripened cherry tomatoes',
    vendor: 'Hillside Organics',
    price: '$3.49',
    rating: '4.8',
    sale: '-15%',
    img: 'https://cdn.magicpatterns.com/patterns/generated-images/71dea51a-4fc5-46ba-ae72-c8acaac23414.jpg',
  },
  {
    name: 'Hass avocados, pack of 4',
    vendor: 'Green Valley Farm',
    price: '$5.99',
    rating: '4.7',
    sale: null,
    img: 'https://cdn.magicpatterns.com/patterns/generated-images/333627a0-3f3b-431a-b50b-340b4631121d.jpg',
  },
  {
    name: 'Strawberries, 1 lb punnet',
    vendor: 'Sunny Acres',
    price: '$4.25',
    rating: '4.9',
    sale: 'New',
    img: 'https://cdn.magicpatterns.com/patterns/generated-images/a77055c5-4f6c-4f41-ab51-83c2893d9f15.jpg',
  },
  {
    name: 'Heirloom tomato mix',
    vendor: 'Hillside Organics',
    price: '$6.80',
    rating: '4.6',
    sale: null,
    img: 'https://cdn.magicpatterns.com/patterns/generated-images/71dea51a-4fc5-46ba-ae72-c8acaac23414.jpg',
  },
]
