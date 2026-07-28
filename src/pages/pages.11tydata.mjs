const getObjectProperty = (obj, keyString) => {
    if (!obj || !keyString) return undefined;
    const keyStr = String(keyString);
    let arr = keyStr.split(".");
    while (arr.length && (obj = obj[arr.shift()]));
    return obj || undefined;
}

const pathToDotNotation = (path, slicing = 0) => {
    if (!path) return '';
    const pathStr = String(path);
    return pathStr.split('/').filter(e => e !== '').slice(slicing).join('.');
}

const toStandardPath = (path) => {
    if (!path) return '';
    let pathStr = String(path).trim();

    if (pathStr.startsWith('/')) {
        pathStr = pathStr.substring(1);
    }

    if (pathStr.endsWith('/')) {
        pathStr = pathStr.substring(0, pathStr.length - 1);
    }
    return pathStr;
}

const config = {
    pagination: {
        data: "config.languages",
        size: 1,
        alias: "lang"
    },
    helpers: {
        getObjectProperty,
        pathToDotNotation,
        toStandardPath
    },
    eleventyComputed: {
        texts: (data) => {
            const rawTexts = data.i18n[data.lang];
            if (!rawTexts || !rawTexts.pages || !rawTexts.pages.courses) {
                return rawTexts;
            }
            // Deep clone courses to avoid mutating original shared i18n data
            const coursesPage = JSON.parse(JSON.stringify(rawTexts.pages.courses));

            // Get courses status map for O(1) lookup
            const statusMap = new Map();
            if (Array.isArray(data.config?.courses_status)) {
                for (const item of data.config.courses_status) {
                    statusMap.set(item.id, item.available);
                }
            }

            const categories = ['kinder', 'kids', 'teens', 'adults'];
            for (const cat of categories) {
                if (coursesPage.courses?.[cat] && Array.isArray(coursesPage.courses[cat].courses)) {
                    coursesPage.courses[cat].courses = coursesPage.courses[cat].courses.filter(course => {
                        return statusMap.get(course.id) !== false;
                    });
                }
            }

            return {
                ...rawTexts,
                pages: {
                    ...rawTexts.pages,
                    courses: coursesPage
                }
            };
        },
        pageId: (data) => pathToDotNotation(data.page.filePathStem, 1),
        title: (data) => getObjectProperty(data.i18n[data.lang], pathToDotNotation(data.page.filePathStem))?.meta?.title,
        description: (data) => getObjectProperty(data.i18n[data.lang], pathToDotNotation(data.page.filePathStem))?.meta?.description,
        permalink: (data) => {
            let pathKey = pathToDotNotation(data.page.filePathStem, 1);
            let url = getObjectProperty(data.routes[data.lang], pathKey);

            // If no route is found, use standard location
            if (!url) {
                console.warn(`⚠️ Missing route for page key "${pathKey}" in language "${data.lang}"`);
                url = `/${data.lang}/${data.page.filePathStem}/index.html`.replace(/\/+/g, '/');
            }

            // Ensure path follows standard format
            url = toStandardPath(url);

            // Strip trailing index.html to prevent duplication
            if (url.endsWith('/index.html')) {
                url = url.substring(0, url.length - 11);
            } else if (url.endsWith('index.html')) {
                url = url.substring(0, url.length - 10);
            }
            url = toStandardPath(url);

            // Prevent double language prefixing (e.g. es/es/contacto)
            if (url === data.lang) {
                url = "";
            } else if (url.startsWith(`${data.lang}/`)) {
                url = url.substring(data.lang.length + 1);
            }

            return `/${data.lang}/${url}/index.html`.replace(/\/+/g, '/');
        }
    }
};

export default config;