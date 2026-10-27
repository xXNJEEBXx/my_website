let allJobs = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const locationFilter = document.getElementById('locationFilter');
const salaryFilter = document.getElementById('salaryFilter');
const tagFilter = document.getElementById('tagFilter');
const dateFilter = document.getElementById('dateFilter');
const jobsGrid = document.getElementById('jobsGrid');
const jobsCount = document.getElementById('jobsCount');

// Init Data from Global Variable
function initData() {
    if (typeof telegramJobsData !== 'undefined') {
        allJobs = telegramJobsData.map(job => {
            // Normalize tags to be arrays
            if (typeof job.tags === 'string') {
                job.tags = job.tags.split(/\s+/).filter(t => t.trim() !== '');
            } else if (!job.tags) {
                job.tags = [];
            }
            
            // Normalize links to be arrays
            if (typeof job.links === 'string') {
                job.links = job.links.split(/\s+/).filter(l => l.trim() !== '');
            } else if (!job.links) {
                job.links = [];
            }
            
            return job;
        });
        populateFilters();
        renderJobs(allJobs);
    } else {
        jobsGrid.innerHTML = '<p style="color: red;">خطأ في تحميل الوظائف.</p>';
    }
}

initData();

// Event Listeners for Filters
searchInput.addEventListener('input', applyFilters);
locationFilter.addEventListener('change', applyFilters);
salaryFilter.addEventListener('change', applyFilters);
tagFilter.addEventListener('change', applyFilters);
dateFilter.addEventListener('change', applyFilters);

function populateFilters() {
    const locations = new Set();
    const tags = new Set();

    allJobs.forEach(job => {
        // Collect exact locations initially (split by ' / ' if multiple, or just keep as is)
        if (job.location && job.location !== 'المدينة غير مذكورة') {
            const locs = job.location.split(' / ').map(l => l.trim());
            locs.forEach(l => locations.add(l));
        }

        // Collect Tags
        if (job.tags && Array.isArray(job.tags)) {
            job.tags.forEach(tag => tags.add(tag));
        }

        // Collect Dates (Extracting only DD.MM.YYYY part)
        if (job.date) {
            const shortDate = job.date.split(' ')[0]; // e.g. "06.05.2026"
            if (shortDate) tags.dateSet = tags.dateSet || new Set();
            if (shortDate && tags.dateSet) tags.dateSet.add(shortDate);
        }
    });

    // Populate Location Select
    [...locations].sort().forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        locationFilter.appendChild(option);
    });

    // Populate Tag Select
    [...tags].sort().forEach(tag => {
        // Exclude generic tags if we want, or just include all
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag.replace('#', '');
        tagFilter.appendChild(option);
    });

    // Populate Date Select
    if (tags.dateSet) {
        // Sort dates descending ideally, or just text sort
        [...tags.dateSet].sort().reverse().forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            dateFilter.appendChild(option);
        });
    }
}

function applyFilters() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedLocation = locationFilter.value;
    const requireSalary = salaryFilter.value === 'مكافأة_مذكورة';
    const selectedTag = tagFilter.value;
    const selectedDate = dateFilter.value;

    const filteredJobs = allJobs.filter(job => {
        // Professional Text Search (AND logic for multiple words)
        const searchWords = searchText ? searchText.split(/\s+/) : [];
        const matchesText = searchWords.every(word => {
            return (job.company && job.company.toLowerCase().includes(word)) ||
                (job.title && job.title.toLowerCase().includes(word)) ||
                (job.description && job.description.toLowerCase().includes(word)) ||
                (job.requirements && job.requirements.toLowerCase().includes(word)) ||
                (job.tags && job.tags.some(tag => tag.toLowerCase().includes(word)));
        });

        // Location Filter (checks if location string contains the selected location)
        const matchesLocation = !selectedLocation ||
            (job.location && job.location.includes(selectedLocation));

        // Professional Salary Filter (Checks both the salary text property and tags)
        const noSalaryKeywords = [
            'غير محدد', 'غير محددة', 'غير محدده',
            'غير مذكور', 'غير مذكورة', 'غير مذكوره',
            'لا يوجد', 'لا توجد', 'بدون', 'غير متوفر', 'غير واضح'
        ];
        const hasSalaryText = job.salary &&
            job.salary.trim() !== '' &&
            !noSalaryKeywords.some(keyword => job.salary.includes(keyword));

        // Make sure we don't accidentally match "#بدون_مكافأة" or "#مكافأة_غير_مذكورة"
        const hasSalaryTag = job.tags && job.tags.some(tag =>
            tag.includes('مكافأة') &&
            !tag.includes('بدون_مكافأة') &&
            !tag.includes('لا_توجد') &&
            !tag.includes('غير_مدفوع') &&
            !tag.includes('غير_مذكور') &&
            !tag.includes('غير_محدد')
        );

        const matchesSalary = !requireSalary || (hasSalaryText || hasSalaryTag);

        // Tag Filter
        const matchesTag = !selectedTag ||
            (job.tags && job.tags.includes(selectedTag));

        // Date Filter
        const matchesDate = !selectedDate ||
            (job.date && job.date.includes(selectedDate));

        return matchesText && matchesLocation && matchesSalary && matchesTag && matchesDate;
    });

    // Sort from newest to oldest
    filteredJobs.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        
        // Parse "DD.MM.YYYY HH:MM:SS"
        const parseDate = (dStr) => {
            try {
                const parts = dStr.split(' ');
                const d = parts[0].split('.');
                if (d.length === 3) {
                    return new Date(`${d[2]}-${d[1]}-${d[0]}T${parts[1] || '00:00:00'}`);
                }
            } catch(e) {}
            return new Date(0);
        };

        return parseDate(b.date) - parseDate(a.date);
    });

    renderJobs(filteredJobs);
}

function renderJobs(jobs) {
    jobsCount.textContent = `عدد النتائج: ${jobs.length}`;
    jobsGrid.innerHTML = '';

    if (jobs.length === 0) {
        jobsGrid.innerHTML = '<p>لا توجد نتائج مطابقة للبحث.</p>';
        return;
    }

    jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';

        const tagsHtml = (job.tags || []).map(tag => `<span class="job-tag">${tag}</span>`).join('');

        let linksHtml = '';
        if (job.links && Array.isArray(job.links)) {
            linksHtml = job.links.map(link => {
                const isEmail = link.startsWith('mailto:');
                const btnText = isEmail ? 'إرسال إيميل ✉️' : 'التقديم 🔗';
                return `<a href="${link}" target="_blank" class="job-link">${btnText}</a>`;
            }).join('');
        }

        card.innerHTML = `
            <div class="job-company">${job.company || 'جهة غير محددة'}</div>
            <div class="job-title">${job.title || 'تدريب عام'}</div>
            ${job.date ? `<div class="job-detail"><strong>📅 التاريخ:</strong> ${job.date}</div>` : ''}
            <div class="job-detail"><strong>📍 المدينة:</strong> ${job.location || 'غير محدد'}</div>
            <div class="job-detail"><strong>💰 المكافأة:</strong> ${job.salary || 'غير محدد'}</div>
            <div class="job-detail"><strong>📋 المتطلبات:</strong> ${job.requirements || 'غير محدد'}</div>
            <div class="job-detail" style="margin-top: 10px;">${job.description || ''}</div>
            
            <div class="job-tags">
                ${tagsHtml}
            </div>

            <div class="job-links">
                ${linksHtml}
            </div>
        `;

        jobsGrid.appendChild(card);
    });
}