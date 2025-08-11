// Sticky header
const header = document.getElementById('header');
const setHeader = () => header.classList.toggle('scrolled', window.scrollY > 8);
setHeader();
addEventListener('scroll', setHeader, {passive:true});

// Slider
const slider = document.querySelector('.slider');
const slides = slider.querySelector('.slides');
const slideEls = Array.from(slides.children);
const dots = slider.querySelector('.dots');
let idx = 0;
slideEls.forEach((_, i) => {
  const b = document.createElement('button');
  b.addEventListener('click', () => go(i));
  dots.appendChild(b);
});
function go(n){
  idx = (n + slideEls.length) % slideEls.length;
  slides.style.transform = `translateX(-${idx * 100}%)`;
  dots.querySelectorAll('button').forEach((d,i)=>d.classList.toggle('active', i===idx));
}
slider.querySelector('.prev').addEventListener('click', () => go(idx-1));
slider.querySelector('.next').addEventListener('click', () => go(idx+1));
go(0);
if (slider.dataset.autoplay === 'true'){
  setInterval(()=>go(idx+1), Number(slider.dataset.interval||4500));
}

// Lightbox
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('.lb-img');
const mediaList = Array.from(document.querySelectorAll('.media'));
let lbIndex = 0;
mediaList.forEach((m, i) => m.addEventListener('click', () => openLB(i)));
function openLB(i){
  lbIndex = i; lbImg.src = mediaList[i].dataset.zoom || mediaList[i].querySelector('img').src; lb.removeAttribute('hidden');
}
function closeLB(){ lb.setAttribute('hidden',''); }
lb.querySelector('.close').addEventListener('click', closeLB);
lb.addEventListener('click', (e)=>{ if(e.target===lb) closeLB(); });
lb.querySelector('.lb-prev').addEventListener('click', ()=> openLB((lbIndex-1+mediaList.length)%mediaList.length));
lb.querySelector('.lb-next').addEventListener('click', ()=> openLB((lbIndex+1)%mediaList.length));
document.addEventListener('keydown',e=>{ if(lb.hasAttribute('hidden')) return; if(e.key==='Escape') closeLB(); if(e.key==='ArrowLeft') lb.querySelector('.lb-prev').click(); if(e.key==='ArrowRight') lb.querySelector('.lb-next').click(); });

// Cart state
const CART_KEY = 'monmignon_cart_v1';
const drawer = document.getElementById('cartDrawer');
const scrim = document.getElementById('scrim');
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');
const cartEmpty = document.getElementById('cartEmpty');
const cartCount = document.getElementById('cartCount');

const loadCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '{"items":[]}');
const saveCart = (c) => { localStorage.setItem(CART_KEY, JSON.stringify(c)); };
let cart = loadCart();

function formatEUR(cents){ return (cents/100).toLocaleString('fr-FR', {style:'currency', currency:'EUR'}); }
function subtotal(){ return cart.items.reduce((s,i)=> s + i.quantity * 6500, 0); }
function count(){ return cart.items.reduce((s,i)=> s + i.quantity, 0); }

function renderCart(){
  cartList.innerHTML = '';
  if(cart.items.length === 0){
    cartEmpty.style.display = 'block';
  } else {
    cartEmpty.style.display = 'none';
    for(const it of cart.items){
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <img src="${it.img}" alt="${it.name}">
        <div>
          <div class="item-title">${it.name}</div>
          <div class="item-sub">Taille ${it.size}</div>
          <div class="qty">
            <button aria-label="Moins">−</button>
            <span>${it.quantity}</span>
            <button aria-label="Plus">+</button>
          </div>
        </div>
        <div>
          <div>${formatEUR(it.quantity*6500)}</div>
          <button class="remove">Supprimer</button>
        </div>
      `;
      const [minus, display, plus] = li.querySelectorAll('.qty *');
      minus.addEventListener('click', ()=>{ it.quantity=Math.max(1,it.quantity-1); saveCart(cart); renderCart(); });
      plus.addEventListener('click', ()=>{ it.quantity+=1; saveCart(cart); renderCart(); });
      li.querySelector('.remove').addEventListener('click', ()=>{ cart.items = cart.items.filter(x => !(x.id===it.id && x.size===it.size)); saveCart(cart); renderCart(); });
      cartList.appendChild(li);
    }
  }
  cartTotal.textContent = formatEUR(subtotal());
  cartCount.textContent = count();
}

function openCart(){ drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); scrim.hidden=false; }
function closeCart(){ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); scrim.hidden=true; }
document.getElementById('openCart').addEventListener('click', openCart);
document.getElementById('openCartFooter').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);

// Add to cart buttons
document.querySelectorAll('.card').forEach(card => {
  const addBtn = card.querySelector('.add');
  const sizeSel = card.querySelector('.size');
  addBtn.addEventListener('click', ()=>{
    const item = {
      id: card.dataset.id,
      name: card.dataset.name,
      img: card.dataset.img,
      size: sizeSel.value,
      quantity: 1
    };
    // merge if same id+size
    const existing = cart.items.find(i => i.id===item.id && i.size===item.size);
    if(existing) existing.quantity += 1; else cart.items.push(item);
    saveCart(cart); renderCart(); openCart();
  });
});

// Checkout with Stripe (serverless)
document.getElementById('checkoutBtn').addEventListener('click', async ()=> {
  if(cart.items.length === 0){ alert('Votre panier est vide.'); return; }
  try {
    const res = await fetch('/api/create-checkout-session', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ items: cart.items, origin: window.location.origin })
    });
    const data = await res.json();
    if(data.url) {
      window.location.href = data.url;
    } else {
      alert('Erreur: ' + (data.error || 'impossible de créer la session Stripe'));
    }
  } catch (e) {
    alert('Erreur réseau. Hébergez le site (Vercel/Netlify) pour activer Stripe.');
  }
});

// Init
renderCart();
document.getElementById('year').textContent = new Date().getFullYear();

// Buy Now buttons (direct Stripe checkout for a single item)
document.querySelectorAll('.card').forEach(card => {
  const buyBtn = card.querySelector('.buynow');
  const sizeSel = card.querySelector('.size');
  buyBtn.addEventListener('click', async () => {
    const item = {
      id: card.dataset.id,
      name: card.dataset.name,
      img: card.dataset.img,
      size: sizeSel.value,
      quantity: 1
    };
    try {
      const res = await fetch('/api/create-checkout-session', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ items: [item], origin: window.location.origin })
      });
      const data = await res.json();
      if(data.url) window.location.href = data.url;
      else alert('Erreur Stripe: ' + (data.error || 'Impossible de créer la session'));
    } catch(e){
      alert('Hébergement requis pour Stripe (Vercel/Netlify).');
    }
  });
});
