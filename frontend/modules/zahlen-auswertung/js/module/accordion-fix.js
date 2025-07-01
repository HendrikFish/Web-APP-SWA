/**
 * Akkordeon-Reparatur für Mobile-Ansicht
 * Diese Datei behebt das Problem mit dem nicht funktionierenden Akkordeon
 */

// CSS für max-height Animation hinzufügen
const accordionStyles = `
<style>
.mobile-accordion-content.show {
    max-height: 1000px !important;
    padding: 1rem !important;
}

.mobile-accordion-content {
    max-height: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    transition: max-height 0.4s ease, padding 0.4s ease !important;
}

/* Kompakte "auf eine Zeile" Darstellung */
.mobile-accordion-header {
    padding: 0.4rem 0.75rem !important;
    min-height: 40px !important;
}

.mobile-tag-header {
    gap: 6px !important;
}

.mobile-tag-name {
    font-size: 0.85rem !important;
}

.mobile-tag-datum {
    font-size: 0.75rem !important;
}

.mobile-tag-gesamtzahl {
    font-size: 0.85rem !important;
    padding: 2px 6px !important;
    min-width: 30px !important;
}

.mobile-tag-info-btn {
    opacity: 1 !important;
    width: 26px !important;
    height: 26px !important;
    font-size: 0.7rem !important;
    padding: 0.15rem !important;
}
</style>
`;

// Füge CSS zum Head hinzu
document.head.insertAdjacentHTML('beforeend', accordionStyles);

/**
 * Repariert das Mobile-Akkordeon
 */
export function setupMobileAccordionFix() {
    console.log('🔧 Akkordeon-Reparatur wird angewendet...');
    
    // Warte kurz, bis das DOM geladen ist
    setTimeout(() => {
        const headers = document.querySelectorAll('.mobile-accordion-header');
        
        if (headers.length === 0) {
            console.log('⏳ Keine Akkordeon-Header gefunden, versuche es erneut...');
            setTimeout(() => setupMobileAccordionFix(), 500);
            return;
        }
        
        console.log(`✅ ${headers.length} Akkordeon-Header gefunden`);
        
        headers.forEach((header, index) => {
            // Entferne alle existierenden Event-Listener
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            newHeader.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`🖱️ Akkordeon ${index + 1} angeklickt`);
                
                const targetId = newHeader.getAttribute('data-accordion-target');
                const content = document.getElementById(targetId);
                const chevron = newHeader.querySelector('.mobile-chevron');
                
                if (!content) {
                    console.error(`❌ Content mit ID "${targetId}" nicht gefunden`);
                    return;
                }
                
                if (!chevron) {
                    console.error('❌ Chevron nicht gefunden');
                    return;
                }
                
                // Toggle aktuellen Content
                const isAktiv = content.classList.contains('show');
                
                // Schließe alle anderen Akkordeons
                document.querySelectorAll('.mobile-accordion-content').forEach(otherContent => {
                    if (otherContent !== content) {
                        otherContent.classList.remove('show');
                    }
                });
                
                document.querySelectorAll('.mobile-accordion-header').forEach(otherHeader => {
                    if (otherHeader !== newHeader) {
                        otherHeader.classList.remove('aktiv');
                        const otherChevron = otherHeader.querySelector('.mobile-chevron');
                        if (otherChevron) {
                            otherChevron.classList.remove('bi-chevron-up');
                            otherChevron.classList.add('bi-chevron-down');
                        }
                    }
                });
                
                if (isAktiv) {
                    // Schließen
                    console.log(`🔽 Schließe Akkordeon ${index + 1}`);
                    content.classList.remove('show');
                    newHeader.classList.remove('aktiv');
                    chevron.classList.remove('bi-chevron-up');
                    chevron.classList.add('bi-chevron-down');
                } else {
                    // Öffnen
                    console.log(`🔼 Öffne Akkordeon ${index + 1}`);
                    content.classList.add('show');
                    newHeader.classList.add('aktiv');
                    chevron.classList.remove('bi-chevron-down');
                    chevron.classList.add('bi-chevron-up');
                }
            });
            
            // Touch-Optimierung
            newHeader.addEventListener('touchstart', (e) => {
                newHeader.style.backgroundColor = '#dee2e6';
            });
            
            newHeader.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    newHeader.style.backgroundColor = '';
                }, 150);
            });
        });
        
        console.log('🎉 Akkordeon-Reparatur erfolgreich angewendet!');
        
    }, 100);
}

// Auto-Setup wenn DOM bereit ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileAccordionFix);
} else {
    setupMobileAccordionFix();
} 