import { useEffect, useMemo, useState } from 'react';
import { Badge, Btn, Card, Input, Logo, Textarea } from './components/ui';
import { askGemini } from './lib/gemini';
import { defaultDB, loadDB, saveDB, SESSION_KEY, uid } from './lib/storage';
import type { Book, Database, Page, Session, User } from './types';

const ADMIN_EMAIL = 'adminpresident@gmail.com';
const ADMIN_PASS = 'LOB419LOB419';

export default function App() {
  const [db, setDb] = useState<Database>(() => loadDB());
  const [session, setSession] = useState<Session>(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Session;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState<Page>(session ? (session.role === 'admin' ? 'admin' : 'dashboard') : 'home');
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [readerBook, setReaderBook] = useState<Book | null>(null);
  const [cart, setCart] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [aiInput, setAiInput] = useState('');
  const [aiOut, setAiOut] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'orders' | 'books' | 'release'>('overview');
  const [releaseForm, setReleaseForm] = useState({ userId: '', bookId: '', note: '' });
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: 'General',
    price: '',
    description: '',
    content: '',
    cover: '📘',
  });

  useEffect(() => {
    saveDB(db);
  }, [db]);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const isAdmin = session?.role === 'admin';
  const user: User | null =
    session?.role === 'user' ? db.users.find((u) => u.id === session.userId) || null : null;

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(db.books.map((b) => b.category)))],
    [db.books]
  );

  const filteredBooks = db.books.filter((b) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q);
    const matchC = catFilter === 'All' || b.category === catFilter;
    return matchQ && matchC;
  });

  const userOrders = user ? db.orders.filter((o) => o.userId === user.id && o.status === 'paid') : [];
  const ownedBookIds = new Set(userOrders.flatMap((o) => o.items.map((i) => i.bookId)));
  const releasedForUser = user ? db.releases[user.id] || {} : {};

  const go = (p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.users.some((u) => u.email.toLowerCase() === authForm.email.toLowerCase())) {
      notify('Email already registered');
      return;
    }
    if (authForm.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      notify('This email is reserved');
      return;
    }
    const u: User = {
      id: uid(),
      name: authForm.name,
      email: authForm.email.toLowerCase(),
      password: authForm.password,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setDb((d) => ({ ...d, users: [...d.users, u] }));
    setSession({ role: 'user', userId: u.id });
    notify('Account created');
    go('dashboard');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    const pass = authForm.password;
    if (email === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASS) {
      setSession({ role: 'admin' });
      notify('Admin signed in');
      go('admin');
      return;
    }
    const u = db.users.find((x) => x.email === email && x.password === pass);
    if (!u) {
      notify('Invalid email or password');
      return;
    }
    setDb((d) => ({
      ...d,
      users: d.users.map((x) => (x.id === u.id ? { ...x, lastLogin: new Date().toISOString() } : x)),
    }));
    setSession({ role: 'user', userId: u.id });
    notify('Welcome back');
    go('dashboard');
  };

  const logout = () => {
    setSession(null);
    setCart([]);
    go('home');
    notify('Signed out');
  };

  const addToCart = (book: Book) => {
    if (!session || isAdmin) {
      notify('Please sign in as a student to purchase');
      go('login');
      return;
    }
    if (ownedBookIds.has(book.id)) {
      notify('You already own this book');
      return;
    }
    if (cart.some((c) => c.id === book.id)) {
      notify('Already in cart');
      return;
    }
    setCart((c) => [...c, book]);
    notify('Added to cart');
  };

  const checkout = () => {
    if (!user || cart.length === 0) return;
    const order = {
      id: uid(),
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      items: cart.map((b) => ({ bookId: b.id, title: b.title, price: b.price })),
      total: cart.reduce((s, b) => s + b.price, 0),
      status: 'paid',
      createdAt: new Date().toISOString(),
      paymentMethod: 'Card (simulated)',
    };
    setDb((d) => {
      const rel = { ...(d.releases[user.id] || {}) };
      cart.forEach((b) => {
        rel[b.id] = { released: true, releasedAt: new Date().toISOString(), by: 'auto' };
      });
      return {
        ...d,
        orders: [order, ...d.orders],
        releases: { ...d.releases, [user.id]: rel },
      };
    });
    setCart([]);
    notify('Purchase successful! Books unlocked in My Library');
    go('library');
  };

  const adminRelease = () => {
    if (!releaseForm.userId || !releaseForm.bookId) {
      notify('Select user and book');
      return;
    }
    setDb((d) => {
      const rel = { ...(d.releases[releaseForm.userId] || {}) };
      rel[releaseForm.bookId] = {
        released: true,
        releasedAt: new Date().toISOString(),
        by: 'admin',
        note: releaseForm.note,
      };
      return { ...d, releases: { ...d.releases, [releaseForm.userId]: rel } };
    });
    notify('Content released to user');
    setReleaseForm({ userId: '', bookId: '', note: '' });
  };

  const adminAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const book: Book = {
      id: uid(),
      title: newBook.title,
      author: newBook.author,
      category: newBook.category || 'General',
      price: parseFloat(newBook.price) || 0,
      cover: newBook.cover || '📘',
      description: newBook.description,
      pages: Math.max(10, Math.floor((newBook.content || '').length / 500)),
      rating: 5,
      content: newBook.content || `# ${newBook.title}\n\nContent pending.`,
    };
    setDb((d) => ({ ...d, books: [book, ...d.books] }));
    setNewBook({
      title: '',
      author: '',
      category: 'General',
      price: '',
      description: '',
      content: '',
      cover: '📘',
    });
    notify('Book published');
  };

  const openReader = (book: Book) => {
    if (!user) return;
    const released = releasedForUser[book.id]?.released;
    if (!ownedBookIds.has(book.id) || !released) {
      notify('This book is not released for reading yet');
      return;
    }
    setReaderBook(book);
    go('reader');
  };

  const runAI = async (mode: 'explain' | 'summary' | 'quiz') => {
    setLoading(true);
    setAiOut('');
    try {
      let prompt = aiInput;
      if (mode === 'summary' && readerBook) {
        prompt = `Summarize this book content for a student:\n\n${readerBook.content.slice(0, 6000)}`;
      }
      if (mode === 'quiz' && readerBook) {
        prompt = `Create 5 short quiz questions with answers from:\n\n${readerBook.content.slice(0, 6000)}`;
      }
      if (mode === 'explain') {
        prompt = `Explain clearly for a student:\n${aiInput || readerBook?.title || 'study skills'}`;
      }
      const text = await askGemini(prompt);
      setAiOut(text);
    } catch (err) {
      setAiOut('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const Nav = () => (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <button
          onClick={() => go(session ? (isAdmin ? 'admin' : 'dashboard') : 'home')}
          className="flex items-center gap-2 font-bold text-brand-900"
        >
          <Logo size="sm" />
          <span className="hidden sm:inline">StudyMate</span>
        </button>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {!session && (
            <>
              <button onClick={() => go('store')} className="px-3 py-1.5 rounded-lg hover:bg-brand-50 text-slate-700">
                Bookstore
              </button>
              <button onClick={() => go('about')} className="px-3 py-1.5 rounded-lg hover:bg-brand-50 text-slate-700">
                About
              </button>
              <Btn size="sm" variant="ghost" onClick={() => go('login')}>
                Log in
              </Btn>
              <Btn size="sm" onClick={() => go('signup')}>
                Sign up
              </Btn>
            </>
          )}
          {session && !isAdmin && (
            <>
              {(['dashboard', 'store', 'library', 'tutor'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => go(p)}
                  className={`px-3 py-1.5 rounded-lg capitalize ${
                    page === p ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  {p === 'dashboard' ? 'Home' : p === 'tutor' ? 'AI Tutor' : p}
                </button>
              ))}
              <button onClick={() => go('cart')} className="px-3 py-1.5 rounded-lg text-slate-600 relative">
                Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-brand-600 text-white text-[10px] px-1.5 rounded-full">{cart.length}</span>
                )}
              </button>
              <Btn size="sm" variant="ghost" onClick={logout}>
                Logout
              </Btn>
            </>
          )}
          {isAdmin && (
            <>
              <button onClick={() => go('admin')} className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-semibold">
                Admin
              </button>
              <Btn size="sm" variant="ghost" onClick={logout}>
                Logout
              </Btn>
            </>
          )}
        </nav>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1">
        {page === 'home' && (
          <div className="fade">
            <section className="hero-bg text-white">
              <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-100 text-sm mb-5 border border-white/10">
                    Digital learning & bookstore · Gemini AI
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-4">
                    Buy books. Read in-app.
                    <br />
                    <span className="text-brand-300">Master every subject.</span>
                  </h1>
                  <p className="text-brand-100 text-lg mb-8 max-w-lg">
                    StudyMate is a complete learning marketplace: purchase digital books, unlock in-app reading, study
                    with an AI tutor, and track progress — all in one platform.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Btn size="lg" onClick={() => go('signup')}>
                      Create free account
                    </Btn>
                    <Btn
                      size="lg"
                      variant="outlineDark"
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={() => go('store')}
                    >
                      Browse bookstore
                    </Btn>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['6+', 'Featured titles'],
                    ['AI', 'Tutor built-in'],
                    ['100%', 'In-app reading'],
                    ['Admin', 'Full control'],
                  ].map(([a, b]) => (
                    <div key={b} className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur">
                      <div className="text-2xl font-bold text-white">{a}</div>
                      <div className="text-sm text-brand-200">{b}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <section className="max-w-6xl mx-auto px-4 py-16">
              <h2 className="text-2xl font-bold text-center mb-3 text-brand-950">Built for real learning workflows</h2>
              <p className="text-center text-slate-500 mb-10 max-w-2xl mx-auto">
                Discovery, purchase, secure reading, and AI-assisted study in one TypeScript product.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  ['Bookstore', 'Browse academic titles by subject, price, and rating.'],
                  ['Secure checkout', 'Simulated checkout with instant library unlock.'],
                  ['In-app reader', 'Read only inside StudyMate after release.'],
                  ['AI Tutor', 'Summaries, explanations, and quizzes powered by Gemini.'],
                  ['Progress hub', 'Dashboard with owned books and recent orders.'],
                  ['Admin console', 'Users, sales, catalog, and content release controls.'],
                ].map(([t, d]) => (
                  <Card key={t} className="p-6 card-hover transition">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold mb-3">
                      ◆
                    </div>
                    <h3 className="font-bold text-brand-950 mb-2">{t}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{d}</p>
                  </Card>
                ))}
              </div>
            </section>
            <section className="bg-brand-950 text-white py-14">
              <div className="max-w-3xl mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold mb-3">Ready to start learning?</h2>
                <p className="text-brand-200 mb-6">Join StudyMate and build your library today.</p>
                <Btn size="lg" onClick={() => go('signup')}>
                  Get started free
                </Btn>
              </div>
            </section>
            <footer className="border-t py-8 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} StudyMate · Learn without limits
            </footer>
          </div>
        )}

        {(page === 'login' || page === 'signup') && (
          <div className="min-h-[80vh] flex items-center justify-center px-4 py-10 fade">
            <div className="w-full max-w-md">
              <div className="text-center mb-6">
                <Logo size="lg" />
                <h1 className="text-2xl font-bold mt-4 text-brand-950">
                  {page === 'login' ? 'Welcome back' : 'Create your account'}
                </h1>
              </div>
              <Card className="p-6">
                <form onSubmit={page === 'login' ? handleLogin : handleSignup} className="space-y-4">
                  {page === 'signup' && (
                    <Input
                      label="Full name"
                      required
                      value={authForm.name}
                      onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  )}
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  />
                  <Input
                    label="Password"
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <Btn type="submit" className="w-full">
                    {page === 'login' ? 'Log in' : 'Sign up'}
                  </Btn>
                </form>
                <p className="text-center text-sm text-slate-500 mt-4">
                  {page === 'login' ? (
                    <>
                      No account?{' '}
                      <button className="text-brand-600 font-semibold" onClick={() => go('signup')}>
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Have an account?{' '}
                      <button className="text-brand-600 font-semibold" onClick={() => go('login')}>
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </Card>
            </div>
          </div>
        )}

        {page === 'store' && (
          <div className="max-w-6xl mx-auto px-4 py-8 fade">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-brand-950">Bookstore</h1>
                <p className="text-slate-500 mt-1">Purchase once, read in-app after unlock.</p>
              </div>
              <input
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm w-full sm:w-56"
                placeholder="Search books..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                    catFilter === c ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBooks.map((b) => (
                <Card key={b.id} className="overflow-hidden card-hover transition flex flex-col">
                  <div className="h-36 bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center text-5xl">
                    {b.cover}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-brand-950 leading-snug">{b.title}</h3>
                      <Badge>{b.category}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {b.author} · {b.pages} pages · ★ {b.rating}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">{b.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-extrabold text-brand-700">${b.price.toFixed(2)}</span>
                      <div className="flex gap-2">
                        <Btn
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBook(b);
                            go('book');
                          }}
                        >
                          Details
                        </Btn>
                        <Btn size="sm" onClick={() => addToCart(b)}>
                          Add
                        </Btn>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {page === 'book' && selectedBook && (
          <div className="max-w-3xl mx-auto px-4 py-8 fade">
            <button className="text-sm text-brand-600 mb-4" onClick={() => go('store')}>
              ← Back to store
            </button>
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-brand-900 to-brand-600 flex items-center justify-center text-7xl">
                {selectedBook.cover}
              </div>
              <div className="p-6 sm:p-8">
                <Badge>{selectedBook.category}</Badge>
                <h1 className="text-3xl font-extrabold text-brand-950 mt-2 mb-1">{selectedBook.title}</h1>
                <p className="text-slate-500 mb-4">
                  By {selectedBook.author} · {selectedBook.pages} pages · Rating {selectedBook.rating}/5
                </p>
                <p className="text-slate-700 leading-relaxed mb-6">{selectedBook.description}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-3xl font-extrabold text-brand-700">${selectedBook.price.toFixed(2)}</span>
                  {ownedBookIds.has(selectedBook.id) ? (
                    <Btn onClick={() => openReader(selectedBook)}>Read in library</Btn>
                  ) : (
                    <Btn onClick={() => addToCart(selectedBook)}>Add to cart</Btn>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {page === 'cart' && (
          <div className="max-w-2xl mx-auto px-4 py-8 fade">
            <h1 className="text-2xl font-bold mb-6">Your cart</h1>
            {cart.length === 0 ? (
              <Card className="p-10 text-center text-slate-500">
                Cart is empty.{' '}
                <button className="text-brand-600 font-semibold" onClick={() => go('store')}>
                  Browse books
                </button>
              </Card>
            ) : (
              <div className="space-y-4">
                {cart.map((b) => (
                  <Card key={b.id} className="p-4 flex items-center gap-4">
                    <div className="text-3xl">{b.cover}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{b.title}</div>
                      <div className="text-sm text-slate-500">${b.price.toFixed(2)}</div>
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setCart((c) => c.filter((x) => x.id !== b.id))}>
                      Remove
                    </Btn>
                  </Card>
                ))}
                <Card className="p-5">
                  <div className="flex justify-between font-bold text-lg mb-4">
                    <span>Total</span>
                    <span className="text-brand-700">${cart.reduce((s, b) => s + b.price, 0).toFixed(2)}</span>
                  </div>
                  <Btn className="w-full" onClick={checkout}>
                    Pay & unlock books
                  </Btn>
                </Card>
              </div>
            )}
          </div>
        )}

        {page === 'library' && (
          <div className="max-w-6xl mx-auto px-4 py-8 fade">
            <h1 className="text-2xl font-bold mb-2">My Library</h1>
            <p className="text-slate-500 mb-6">Purchased books available for in-app reading after release.</p>
            {db.books.filter((b) => ownedBookIds.has(b.id)).length === 0 ? (
              <Card className="p-10 text-center text-slate-500">
                No books yet.{' '}
                <button className="text-brand-600 font-semibold" onClick={() => go('store')}>
                  Visit the store
                </button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {db.books
                  .filter((b) => ownedBookIds.has(b.id))
                  .map((b) => {
                    const rel = releasedForUser[b.id];
                    return (
                      <Card key={b.id} className="p-5 flex gap-4">
                        <div className="text-4xl">{b.cover}</div>
                        <div className="flex-1">
                          <h3 className="font-bold">{b.title}</h3>
                          <p className="text-xs text-slate-500 mb-2">{b.author}</p>
                          {rel?.released ? (
                            <Btn size="sm" onClick={() => openReader(b)}>
                              Read now
                            </Btn>
                          ) : (
                            <Badge color="amber">Awaiting admin release</Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {page === 'reader' && readerBook && (
          <div className="max-w-3xl mx-auto px-4 py-6 fade">
            <div className="flex items-center justify-between mb-4 gap-2">
              <button className="text-sm text-brand-600" onClick={() => go('library')}>
                ← Library
              </button>
              <Badge color="blue">In-app reading only</Badge>
            </div>
            <Card className="p-6 sm:p-10">
              <h1 className="text-2xl font-extrabold text-brand-950 mb-1">{readerBook.title}</h1>
              <p className="text-sm text-slate-500 mb-8">{readerBook.author}</p>
              <div className="text-slate-800 leading-relaxed whitespace-pre-wrap text-[15px]">{readerBook.content}</div>
            </Card>
            <div className="mt-4">
              <Btn variant="soft" onClick={() => go('tutor')}>
                Ask AI about this book
              </Btn>
            </div>
          </div>
        )}

        {page === 'dashboard' && (
          <div className="max-w-6xl mx-auto px-4 py-8 fade">
            <h1 className="text-2xl font-bold mb-1">Hello, {user?.name?.split(' ')[0] || 'Learner'}</h1>
            <p className="text-slate-500 mb-6">Your StudyMate overview</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                [ownedBookIds.size, 'Books owned'],
                [userOrders.length, 'Orders'],
                [Object.values(releasedForUser).filter((r) => r.released).length, 'Readable now'],
                [cart.length, 'In cart'],
              ].map(([v, l]) => (
                <Card key={String(l)} className="p-4 text-center">
                  <div className="text-2xl font-extrabold text-brand-700">{v}</div>
                  <div className="text-xs text-slate-500">{l}</div>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => go('store')}>Browse store</Btn>
              <Btn variant="outline" onClick={() => go('library')}>
                Open library
              </Btn>
              <Btn variant="soft" onClick={() => go('tutor')}>
                AI Tutor
              </Btn>
            </div>
          </div>
        )}

        {page === 'tutor' && (
          <div className="max-w-3xl mx-auto px-4 py-8 fade">
            <h1 className="text-2xl font-bold mb-2">AI Tutor</h1>
            <p className="text-slate-500 mb-6">
              Ask for explanations, summaries, or practice questions powered by Gemini.
            </p>
            <Card className="p-5 space-y-4">
              <Textarea
                label="Your question or topic"
                placeholder="e.g. Explain mitochondria simply"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => runAI('explain')} disabled={loading}>
                  {loading ? 'Thinking…' : 'Explain'}
                </Btn>
                <Btn variant="outline" onClick={() => runAI('summary')} disabled={loading || !readerBook}>
                  Summarize open book
                </Btn>
                <Btn variant="soft" onClick={() => runAI('quiz')} disabled={loading || !readerBook}>
                  Quiz from open book
                </Btn>
              </div>
              {aiOut && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {aiOut}
                </div>
              )}
            </Card>
          </div>
        )}

        {page === 'admin' && isAdmin && (
          <div className="max-w-6xl mx-auto px-4 py-8 fade">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-950">Admin Console</h1>
                <p className="text-slate-500 text-sm">Users, sales, catalog, and content release</p>
              </div>
              <Badge color="blue">Administrator</Badge>
            </div>
            <div className="flex gap-2 overflow-x-auto mb-6">
              {(['overview', 'users', 'orders', 'books', 'release'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAdminTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
                    adminTab === t ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {adminTab === 'overview' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  [db.users.length, 'Registered users'],
                  [db.orders.length, 'Total orders'],
                  [
                    '$' +
                      db.orders
                        .filter((o) => o.status === 'paid')
                        .reduce((s, o) => s + o.total, 0)
                        .toFixed(2),
                    'Gross revenue',
                  ],
                  [db.books.length, 'Catalog titles'],
                ].map(([v, l]) => (
                  <Card key={String(l)} className="p-5">
                    <div className="text-2xl font-extrabold text-brand-800">{v}</div>
                    <div className="text-xs text-slate-500 mt-1">{l}</div>
                  </Card>
                ))}
              </div>
            )}
            {adminTab === 'users' && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-50 text-brand-900">
                      <tr>
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Joined</th>
                        <th className="text-left p-3">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.users.map((u) => (
                        <tr key={u.id} className="border-t border-slate-100">
                          <td className="p-3 font-medium">{u.name}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="p-3">{db.orders.filter((o) => o.userId === u.id).length}</td>
                        </tr>
                      ))}
                      {db.users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500">
                            No users yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
            {adminTab === 'orders' && (
              <div className="space-y-3">
                {db.orders.length === 0 && <Card className="p-8 text-center text-slate-500">No orders yet</Card>}
                {db.orders.map((o) => (
                  <Card key={o.id} className="p-5">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <div>
                        <div className="font-bold">
                          {o.userName} <span className="font-normal text-slate-500">({o.userEmail})</span>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-brand-700">${o.total.toFixed(2)}</div>
                        <Badge color="green">{o.status}</Badge>
                      </div>
                    </div>
                    <ul className="text-sm text-slate-700">
                      {o.items.map((i, idx) => (
                        <li key={idx}>
                          • {i.title} — ${i.price.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            )}
            {adminTab === 'books' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h2 className="font-bold mb-4">Publish new book</h2>
                  <form onSubmit={adminAddBook} className="space-y-3">
                    <Input label="Title" required value={newBook.title} onChange={(e) => setNewBook((b) => ({ ...b, title: e.target.value }))} />
                    <Input label="Author" required value={newBook.author} onChange={(e) => setNewBook((b) => ({ ...b, author: e.target.value }))} />
                    <Input label="Category" value={newBook.category} onChange={(e) => setNewBook((b) => ({ ...b, category: e.target.value }))} />
                    <Input label="Price (USD)" type="number" step="0.01" required value={newBook.price} onChange={(e) => setNewBook((b) => ({ ...b, price: e.target.value }))} />
                    <Input label="Cover emoji" value={newBook.cover} onChange={(e) => setNewBook((b) => ({ ...b, cover: e.target.value }))} />
                    <Textarea label="Description" required value={newBook.description} onChange={(e) => setNewBook((b) => ({ ...b, description: e.target.value }))} />
                    <Textarea label="Full book content" required value={newBook.content} onChange={(e) => setNewBook((b) => ({ ...b, content: e.target.value }))} />
                    <Btn type="submit" className="w-full">
                      Publish book
                    </Btn>
                  </form>
                </Card>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {db.books.map((b) => (
                    <Card key={b.id} className="p-4 flex gap-3">
                      <div className="text-2xl">{b.cover}</div>
                      <div>
                        <div className="font-semibold">{b.title}</div>
                        <div className="text-xs text-slate-500">
                          {b.author} · ${b.price.toFixed(2)} · {b.category}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {adminTab === 'release' && (
              <Card className="p-6 max-w-xl">
                <h2 className="font-bold mb-2">Release reading access</h2>
                <p className="text-sm text-slate-500 mb-4">Grant in-app reading for a user and book.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">User</label>
                    <select
                      className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                      value={releaseForm.userId}
                      onChange={(e) => setReleaseForm((f) => ({ ...f, userId: e.target.value }))}
                    >
                      <option value="">Select user…</option>
                      {db.users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Book</label>
                    <select
                      className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                      value={releaseForm.bookId}
                      onChange={(e) => setReleaseForm((f) => ({ ...f, bookId: e.target.value }))}
                    >
                      <option value="">Select book…</option>
                      {db.books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Internal note (optional)"
                    value={releaseForm.note}
                    onChange={(e) => setReleaseForm((f) => ({ ...f, note: e.target.value }))}
                  />
                  <Btn onClick={adminRelease}>Release to user</Btn>
                </div>
              </Card>
            )}
          </div>
        )}

        {page === 'about' && (
          <div className="max-w-3xl mx-auto px-4 py-12 fade">
            <h1 className="text-3xl font-extrabold text-brand-950 mb-4">About StudyMate</h1>
            <p className="text-slate-600 leading-relaxed mb-4">
              StudyMate is a digital learning and bookstore platform built with React and TypeScript. Browse academic
              titles, purchase securely, and read exclusively inside the application after access is released.
            </p>
            <p className="text-slate-600 leading-relaxed">
              The product combines commerce, access control, an in-app reader, and a Gemini-powered AI study assistant.
            </p>
          </div>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-950 text-white px-5 py-3 rounded-xl text-sm shadow-xl fade max-w-[90vw]">
          {toast}
        </div>
      )}
    </div>
  );
}
