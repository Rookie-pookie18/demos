/* Drawn-in-code artwork: tea caddies and ingredient cut-outs (stand-ins until real pack shots exist). */
window.Art = (function () {
  var uid = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function rose(cx, cy, r, fill, centre) {
    var out = '';
    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(a) * r * 0.55, y = cy + Math.sin(a) * r * 0.55;
      out += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (r * 0.52).toFixed(1) + '" ry="' + (r * 0.4).toFixed(1) + '" transform="rotate(' + (a * 180 / Math.PI + 90).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="' + fill + '"/>';
    }
    return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.3).toFixed(1) + '" fill="' + centre + '"/>';
  }

  // A cylindrical tea caddy with a paper label
  function tin(t) {
    var id = 'tn' + (++uid);
    var words = t.name.split(' ');
    var l1 = words.length > 2 ? words.slice(0, 2).join(' ') : words[0];
    var l2 = words.length > 2 ? words.slice(2).join(' ') : words.slice(1).join(' ');
    return '<svg viewBox="0 0 240 330" role="img" aria-label="' + esc(t.name) + ' caddy">' +
      '<defs>' +
      '<linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="' + t.label + '"/><stop offset=".28" stop-color="' + t.pal[0] + '"/><stop offset=".5" stop-color="' + t.pal[1] + '"/><stop offset=".78" stop-color="' + t.pal[0] + '"/><stop offset="1" stop-color="' + t.label + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" x2="1"><stop offset="0" stop-color="' + t.label + '"/><stop offset=".5" stop-color="' + t.pal[0] + '"/><stop offset="1" stop-color="' + t.label + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'p" x1="0" x2="1"><stop offset="0" stop-color="' + t.pal[2] + '"/><stop offset=".45" stop-color="' + t.pal[3] + '"/><stop offset="1" stop-color="' + t.pal[2] + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'h" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '</defs>' +
      '<ellipse cx="120" cy="318" rx="92" ry="9" fill="' + t.label + '" opacity=".25"/>' +
      '<rect x="32" y="62" width="176" height="252" rx="12" fill="url(#' + id + 'b)"/>' +
      '<ellipse cx="120" cy="312" rx="88" ry="6" fill="' + t.label + '" opacity=".6"/>' +
      '<rect x="32" y="112" width="176" height="150" fill="url(#' + id + 'p)"/>' +
      '<line x1="32" y1="119" x2="208" y2="119" stroke="' + t.label + '" stroke-width="1.2" opacity=".6"/>' +
      '<line x1="32" y1="255" x2="208" y2="255" stroke="' + t.label + '" stroke-width="1.2" opacity=".6"/>' +
      '<g opacity=".95">' + rose(120, 142, 12, t.pal[0], t.label) + '</g>' +
      '<text x="120" y="172" text-anchor="middle" font-family="Manrope,sans-serif" font-size="8.5" font-weight="700" letter-spacing="3" fill="' + t.label + '">ITTARBAGH</text>' +
      '<text x="120" y="' + (l2 ? 200 : 212) + '" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-style="italic" font-size="' + (l1.length > 9 ? 21 : 25) + '" fill="' + t.ink + '">' + esc(l1) + '</text>' +
      (l2 ? '<text x="120" y="226" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-style="italic" font-size="' + (l2.length > 9 ? 21 : 25) + '" fill="' + t.ink + '">' + esc(l2) + '</text>' : '') +
      '<text x="120" y="246" text-anchor="middle" font-family="Manrope,sans-serif" font-size="7.5" font-weight="700" letter-spacing="2.2" fill="' + t.label + '">' + esc(t.kind.toUpperCase()) + '</text>' +
      '<rect x="24" y="30" width="192" height="44" rx="10" fill="url(#' + id + 'l)"/>' +
      '<ellipse cx="120" cy="30" rx="96" ry="9" fill="' + t.pal[1] + '"/>' +
      '<ellipse cx="120" cy="30" rx="80" ry="5" fill="' + t.pal[2] + '" opacity=".6"/>' +
      '<rect x="24" y="68" width="192" height="4" fill="' + t.label + '" opacity=".5"/>' +
      '<rect x="72" y="30" width="30" height="284" fill="url(#' + id + 'h)" opacity=".7"/>' +
      '</svg>';
  }

  // Ingredient cut-outs
  var ING = {
    petal: function (c) { var id = 'pg' + (++uid); return '<svg viewBox="0 0 100 100"><defs><radialGradient id="' + id + '" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="' + (c || '#F7B6C6') + '"/><stop offset="1" stop-color="#C24D72"/></radialGradient></defs><path d="M50 6C80 22 94 58 52 95 12 64 14 26 50 6z" fill="url(#' + id + ')"/><path d="M50 14C54 40 54 66 52 90" stroke="#fff" stroke-opacity=".35" stroke-width="1.5" fill="none"/></svg>'; },
    leaf: function () { return '<svg viewBox="0 0 100 100"><path d="M8 92C6 44 44 8 94 8c2 50-36 86-86 84z" fill="#5E8F4E"/><path d="M8 92C8 92 44 60 88 14" stroke="#B9D9A4" stroke-width="2" fill="none"/><path d="M30 70l-10-14M44 56l-12-18M58 42l-10-20M40 64l20 4M54 50l22 2" stroke="#B9D9A4" stroke-width="1.2" fill="none" opacity=".7"/></svg>'; },
    cardamom: function () { return '<svg viewBox="0 0 100 100"><g transform="rotate(-30 50 50)"><ellipse cx="50" cy="50" rx="19" ry="40" fill="#9DB96A"/><path d="M50 12v76M40 16c-6 20-6 48 0 68M60 16c6 20 6 48 0 68" stroke="#6F8C42" stroke-width="1.6" fill="none"/><path d="M50 8l-3-6h6z" fill="#6F8C42"/></g></svg>'; },
    saffron: function () { return '<svg viewBox="0 0 100 100" fill="none" stroke-linecap="round"><path d="M20 90C30 60 40 40 70 10" stroke="#C8321C" stroke-width="3.5"/><path d="M34 92C38 66 50 44 84 24" stroke="#D84A1E" stroke-width="3"/><path d="M12 76C26 56 44 38 56 12" stroke="#B82A18" stroke-width="3"/><path d="M68 10l6-4M82 24l6-2M54 12l4-6" stroke="#F2A93B" stroke-width="5"/></svg>'; },
    almond: function () { return '<svg viewBox="0 0 100 100"><g transform="rotate(25 50 50)"><path d="M50 6C72 30 76 62 50 94 24 62 28 30 50 6z" fill="#C68A57"/><path d="M50 16c6 20 6 50 0 70M42 26c-4 18-4 40 2 56M58 26c4 18 4 40-2 56" stroke="#9A6035" stroke-width="1.2" fill="none" opacity=".8"/></g></svg>'; },
    hibiscus: function () { return '<svg viewBox="0 0 100 100">' + rose(50, 50, 40, '#B8325E', '#6E1446') + '<path d="M50 50l8-20" stroke="#F2C94C" stroke-width="2.5" stroke-linecap="round"/><circle cx="58" cy="29" r="3.5" fill="#F2C94C"/></svg>'; },
    cinnamon: function () { return '<svg viewBox="0 0 100 100"><g transform="rotate(-38 50 50)"><rect x="14" y="40" width="72" height="20" rx="10" fill="#9B5A2E"/><path d="M20 44h60M20 56h60" stroke="#6E3B18" stroke-width="1.2" opacity=".6"/><ellipse cx="86" cy="50" rx="6" ry="10" fill="#C27B45"/><path d="M86 44c-3 2-3 10 0 12 3-2 3-8 0-9" stroke="#6E3B18" stroke-width="1.4" fill="none"/></g></svg>'; }
  };

  return { tin: tin, ing: ING, rose: rose, esc: esc };
})();
