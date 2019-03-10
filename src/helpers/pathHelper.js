module.exports = {
    isAncestor(path) {
        return /^\.\./.test(path);
    },
    isIndex(path) {
        return /^\.(\/index\.\w+)?$/.test(path);
    },
    isPackage(path) {
        return /^[@\w]/.test(path);
    },
    isRelative(path) {
        return /^\./.test(path);
    },
    isSibling(path) {
        return /^\.\//.test(path);
    },
};