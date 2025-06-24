const { createEinrichtung } = require('./createEinrichtung');
const { deleteEinrichtung } = require('./deleteEinrichtung');
const { getEinrichtung } = require('./getEinrichtung');
const { getEinrichtungen } = require('./getEinrichtungen');
const { getEinrichtungStammdaten } = require('./getEinrichtungStammdaten');
const { updateEinrichtung } = require('./updateEinrichtung');

module.exports = {
    createEinrichtung,
    deleteEinrichtung,
    getEinrichtung,
    getEinrichtungen,
    getEinrichtungStammdaten,
    updateEinrichtung
}; 