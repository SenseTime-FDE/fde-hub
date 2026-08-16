/* 营销主站交互：进场动画 + 导航高亮 */
document.addEventListener('DOMContentLoaded', () => {
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
});
