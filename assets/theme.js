(function(){
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var drawer=$('#cart-drawer');
function money(c,cur){try{return new Intl.NumberFormat(undefined,{style:'currency',currency:cur,minimumFractionDigits:c%100?2:0}).format(c/100)}catch(e){return '$'+(c/100)}}
function openCart(){if(!drawer)return;drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeCart(){if(!drawer)return;drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.style.overflow=''}
function render(cart){
  $$('[data-cart-count]').forEach(function(e){e.textContent=cart.item_count});
  $$('[data-cart-subtotal]').forEach(function(e){e.textContent=money(cart.total_price,cart.currency)});
  var box=$('[data-cart-lines]');if(!box)return;
  var h=cart.items.map(function(i,n){return '<div class="dl"><img src="'+(i.image||'')+'" alt=""><div class="dl__i"><strong>'+i.product_title+'</strong>'+(i.variant_title&&i.variant_title!=='Default Title'?'<span class="muted small">'+i.variant_title+'</span>':'')+'<div class="dl__q"><span>Qty '+i.quantity+'</span><button data-line="'+(n+1)+'" data-qty="'+(i.quantity-1)+'">Remove one</button></div></div><strong>'+money(i.final_line_price,cart.currency)+'</strong></div>'}).join('');
  if(!cart.items.length)h='<p class="muted">Your cart is empty.</p>';
  var u=window.NL&&window.NL.upsell;
  if(u&&u.available&&cart.items.length&&!cart.items.some(function(i){return i.variant_id===u.id}))h+='<div class="upsell"><img src="'+u.image+'" alt=""><div><span class="muted small">Add-on</span><br><strong>'+u.title+' · '+money(u.price,cart.currency)+'</strong></div><button class="btn btn--o" data-upsell="'+u.id+'">Add</button></div>';
  box.innerHTML=h;
}
function refresh(open){return fetch('/cart.js').then(function(r){return r.json()}).then(function(c){render(c);if(open)openCart();return c})}
function add(body){return fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body)}).then(function(r){if(!r.ok)throw r;return r.json()}).then(function(){return refresh(true)})}
document.addEventListener('submit',function(e){
  var f=e.target.closest('[data-add-form]');if(!f)return;e.preventDefault();
  var fd=new FormData(f),b=f.querySelector('[type=submit]'),old=b&&b.textContent;if(b){b.disabled=true}
  add({id:+fd.get('id'),quantity:+(fd.get('quantity')||1)}).then(function(){if(b){b.textContent='Added ✓';setTimeout(function(){b.textContent=old;b.disabled=false},1400)}}).catch(function(){if(b){b.disabled=false}f.submit()});
});
document.addEventListener('click',function(e){
  var el=e.target;
  if(el.closest('[data-cart-open]')){e.preventDefault();refresh(true)}
  if(el.closest('[data-cart-close]'))closeCart();
  var dd=el.closest('[data-dd-toggle]');$('.dd.open').forEach(function(d){if(!dd||d!==dd.parentNode)d.classList.remove('open')});if(dd)dd.parentNode.classList.toggle('open');
  if(el.closest('[data-menu-toggle]')){var m=$('#mnav');if(m)m.classList.toggle('open')}
  var q=el.closest('[data-line]');if(q)fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({line:+q.dataset.line,quantity:+q.dataset.qty})}).then(function(r){return r.json()}).then(render);
  var up=el.closest('[data-upsell]');if(up)add({id:+up.dataset.upsell,quantity:1});
  var st=el.closest('[data-qty-step]');if(st){var i=$('input',st.parentNode);i.value=Math.max(1,(+i.value||1)+(+st.dataset.qtyStep))}
  var th=el.closest('[data-thumb]');if(th)slide(+th.dataset.thumb);
  var ar=el.closest('[data-gal-step]');if(ar){var n=$$('.gal__slide').length,c=$$('.gal__slide').findIndex(function(s){return s.classList.contains('on')});slide((c+ +ar.dataset.galStep+n)%n)}
  var sa=el.closest('[data-sticky-add]');if(sa){var f=$('[data-product-form]');if(f&&f.requestSubmit)f.requestSubmit()}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeCart()});
function slide(i){$$('.gal__slide').forEach(function(s,n){s.classList.toggle('on',n===i)});$$('[data-thumb]').forEach(function(s,n){s.classList.toggle('on',n===i)})}
var buy=$('[data-buybox]'),stk=$('[data-sticky]');
if(buy&&stk&&'IntersectionObserver' in window)new IntersectionObserver(function(en){stk.classList.toggle('on',!en[0].isIntersecting&&en[0].boundingClientRect.top<0)}).observe(buy);
$$('[data-variant-input]').forEach(function(r){r.addEventListener('change',function(){$$('[data-sticky-name]').forEach(function(e){e.textContent=r.dataset.name});$$('[data-sticky-price]').forEach(function(e){e.textContent=r.dataset.price});$$('[data-buy-price]').forEach(function(e){e.textContent=r.dataset.price})})});

var byo=$('[data-byo]');
if(byo){var q={set:1,bag:0},d=byo.dataset;
 function calc(){var sp=+d.setPrice,ep=+d.extraPrice,bp=+d.bagPrice,sc=q.set>0?sp+ep*(q.set-1):0,tot=sc+q.bag*bp,reg=q.set*sp+q.bag*bp,cur=(window.Shopify&&Shopify.currency&&Shopify.currency.active)||'USD';
  $('[data-byo-total]',byo).textContent=money(tot,cur);var s=$('[data-byo-save]',byo);s.hidden=reg-tot<=0;s.textContent='You save '+money(reg-tot,cur);
  $('[data-byo-qty]',byo).forEach(function(e){e.textContent=q[e.dataset.byoQty]})}
 byo.addEventListener('click',function(e){var b=e.target.closest('[data-byo-step]');if(b){var k=b.dataset.byoStep;q[k]=Math.min(6,Math.max(0,q[k]+ +b.dataset.d));calc()}
  if(e.target.closest('[data-byo-add]')){var items=[];if(q.set)items.push({id:+d.setId,quantity:q.set});if(q.bag)items.push({id:+d.bagId,quantity:q.bag});if(!items.length)return;
   fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:items})}).then(function(){return refresh(true)})}});
 calc();}
})();