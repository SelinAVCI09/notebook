// Sayfa elemanlarını seç
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const book = document.querySelector("#book");

// Tüm kağıtları otomatik seç
const papers = document.querySelectorAll(".paper");

// Olay Dinleyicileri
prevBtn.addEventListener("click", goPrevPage);
nextBtn.addEventListener("click", goNextPage);

// Sayfalara tıklama ile çevirme özelliği ekle
papers.forEach(paper => {
    const front = paper.querySelector(".front");
    const back = paper.querySelector(".back");
    
    const handlePageClick = (callback) => (e) => {
        if (e.target.tagName === 'VIDEO') return;
        callback();
    };

    if(front) front.addEventListener("click", handlePageClick(goNextPage));
    if(back) back.addEventListener("click", handlePageClick(goPrevPage));
});

// Mevcut sayfa takibi
let currentLocation = 0; // 0: Kitap kapalı (ön yüz), 1: İlk sayfa açık...
let numOfPapers = papers.length;

// Ses Efekti (Dosya yolunu kendine göre ayarla)
// Eğer ses dosyan yoksa bu kısım hata vermez ama ses çıkmaz.
const pageSound = new Audio('sayfa-sesi.mp3'); 

function playSound() {
    // Ses dosyasını baştan oynat
    if(pageSound) {
        pageSound.currentTime = 0;
        pageSound.play().catch(e => console.log("Ses çalınamadı (Tarayıcı politikası olabilir):", e));
    }
}

// Dinamik Renkleri Uygula (VS Code hatalarını önlemek için JS ile yapıyoruz)
function applyColors() {
    document.querySelectorAll('[data-bg-color]').forEach(el => {
        el.style.backgroundColor = el.getAttribute('data-bg-color');
    });
}

// Dinamik Stilleri Uygula (Pozisyon, Boyut, Renk)
function applyDynamicStyles() {
    // Pozisyon ve Boyut
    document.querySelectorAll('.absolute-item').forEach(el => {
        el.style.position = 'absolute';
        if(el.dataset.left) el.style.left = el.dataset.left;
        if(el.dataset.top) el.style.top = el.dataset.top;
        if(el.dataset.width) el.style.width = el.dataset.width;
        if(el.dataset.fontSize) el.style.fontSize = el.dataset.fontSize;
    });

    // Yazı Rengi
    document.querySelectorAll('.dynamic-color').forEach(el => {
        if(el.dataset.color) el.style.color = el.dataset.color;
    });

    // Damga Rengi (Yazı ve Çerçeve)
    document.querySelectorAll('.dynamic-stamp').forEach(el => {
        if(el.dataset.color) {
            el.style.color = el.dataset.color;
            el.style.borderColor = el.dataset.color;
        }
    });
}

// Kazı Kazan Efektini Başlat
function initScratchCards() {
    document.querySelectorAll('.scratch-card-container').forEach(container => {
        const canvas = container.querySelector('.scratch-canvas');
        const ctx = canvas.getContext('2d');
        
        // Canvas boyutlarını konteynere eşitle
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Gri kaplama yap
        ctx.fillStyle = '#C0C0C0'; // Gümüş rengi
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // "Kazıyın" yazısı ekle (Opsiyonel)
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.fillText("Kazımak için çizin", 20, canvas.height / 2);

        let isDrawing = false;

        function scratch(x, y) {
            ctx.globalCompositeOperation = 'destination-out'; // Silme modu
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI); // 15px yarıçapında sil
            ctx.fill();
        }

        // Mouse olayları
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; });
        canvas.addEventListener('mouseup', (e) => { isDrawing = false; });
        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            scratch(e.clientX - rect.left, e.clientY - rect.top);
        });

        // Dokunmatik olayları (Mobil için)
        canvas.addEventListener('touchmove', (e) => {
            const rect = canvas.getBoundingClientRect();
            scratch(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        });
    });
}

// Başlangıçta Z-Indexleri ayarla
function setZIndex() {
    papers.forEach((paper, index) => {
        if (paper.classList.contains("flipped")) {
            // Çevrilmiş sayfalar (Solda): İlk çevrilen en altta, son çevrilen en üstte
            paper.style.zIndex = index + 1;
        } else {
            // Çevrilmemiş sayfalar (Sağda): İlk sayfa en üstte, son sayfa en altta
            paper.style.zIndex = numOfPapers - index;
        }
    });
}

// Sayfa yüklenince düzeni kur
setZIndex();
applyColors();
applyDynamicStyles();
setTimeout(initScratchCards, 500); // Sayfa yüklendikten ve stiller oturduktan sonra başlat

function openBook() {
    book.style.transform = "translateX(50%)";
    prevBtn.style.transform = "translateX(-180px)";
    nextBtn.style.transform = "translateX(180px)";
}

function closeBook(isAtStart) {
    if(isAtStart) {
        book.style.transform = "translateX(0%)";
    } else {
        book.style.transform = "translateX(100%)";
    }
    prevBtn.style.transform = "translateX(0px)";
    nextBtn.style.transform = "translateX(0px)";
}

function goNextPage() {
    if (currentLocation < numOfPapers) {
        playSound(); 
        
        // Eğer ilk sayfayı çeviriyorsak kitabı ortala
        if (currentLocation === 0) openBook();
        
        papers[currentLocation].classList.add("flipped");
        currentLocation++;
        setZIndex();

        // Eğer son sayfayı çevirdiysek kitabı kapat
        if (currentLocation === numOfPapers) closeBook(false);
    }
}

function goPrevPage() {
    if (currentLocation > 0) {
        playSound();

        // Eğer son sayfadan geri geliyorsak kitabı tekrar aç
        if (currentLocation === numOfPapers) openBook();

        currentLocation--;
        papers[currentLocation].classList.remove("flipped");
        setZIndex();

        // Eğer başa döndüysek kitabı kapat
        if (currentLocation === 0) closeBook(true);
    }
}
