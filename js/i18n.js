(() => {
  const dictionaries = {
    fr: {
      'nav.home':'Accueil','nav.find':'Trouver un trajet','nav.publish':'Publier','nav.how':'Comment ça marche','nav.login':'Se connecter',
      'hero.eyebrow':'La route est plus belle à plusieurs','hero.title':'Partagez la route.<br><em>Vivez la Tunisie.</em>',
      'hero.text':'Trouvez des personnes qui vont dans la même direction et transformez chaque trajet en belle rencontre.',
      'hero.cta':'Trouver un trajet','hero.publish':'Publier le mien','search.from':'Départ','search.to':'Destination','search.date':'Date','search.button':'Rechercher',
      'how.title':'Votre trajet,<br><em>en trois mouvements.</em>','how.text':'Moins de dépenses, moins de voitures, plus de rencontres.',
      'how.one.title':'Trouvez votre trajet','how.one.text':'Indiquez où vous allez. Notre communauté a peut-être déjà une place pour vous.',
      'how.two.title':'Faites connaissance','how.two.text':'Consultez les profils et choisissez la personne qui vous ressemble.',
      'how.three.title':'Partagez la route','how.three.text':'Réservez votre place et profitez d’un trajet plus humain.'
    },
    en: {
      'nav.home':'Home','nav.find':'Find a ride','nav.publish':'Publish','nav.how':'How it works','nav.login':'Log in',
      'hero.eyebrow':'The road is better together','hero.title':'Share the road.<br><em>Live Tunisia.</em>',
      'hero.text':'Find people going your way and turn every ride into a memorable encounter.',
      'hero.cta':'Find a ride','hero.publish':'Publish mine','search.from':'From','search.to':'To','search.date':'Date','search.button':'Search',
      'how.title':'Your ride,<br><em>in three moves.</em>','how.text':'Less cost, fewer cars and more encounters.',
      'how.one.title':'Find your ride','how.one.text':'Tell us where you are going. Someone may already have a seat.',
      'how.two.title':'Get to know your match','how.two.text':'Review profiles and choose the person who fits.',
      'how.three.title':'Share the road','how.three.text':'Reserve your seat and enjoy a friendlier trip.'
    },
    ar: {
      'nav.home':'الرئيسية','nav.find':'ابحث عن رحلة','nav.publish':'انشر رحلة','nav.how':'كيف تعمل','nav.login':'تسجيل الدخول',
      'hero.eyebrow':'الطريق أجمل معًا','hero.title':'شارك الطريق.<br><em>عش تونس.</em>',
      'hero.text':'اعثر على أشخاص يسافرون في الاتجاه نفسه وحوّل كل رحلة إلى لقاء جميل.',
      'hero.cta':'ابحث عن رحلة','hero.publish':'انشر رحلتي','search.from':'من','search.to':'إلى','search.date':'التاريخ','search.button':'بحث',
      'how.title':'رحلتك،<br><em>في ثلاث خطوات.</em>','how.text':'تكلفة أقل، سيارات أقل، ولقاءات أكثر.',
      'how.one.title':'اعثر على رحلتك','how.one.text':'حدّد وجهتك فقد يكون أحدهم يوفر لك مقعدًا.',
      'how.two.title':'تعرّف على شريكك','how.two.text':'اطّلع على الملفات واختر الشخص المناسب.',
      'how.three.title':'شارك الطريق','how.three.text':'احجز مقعدك واستمتع برحلة أكثر إنسانية.'
    }
  };
  const setLanguage = lang => {
    if (!dictionaries[lang]) lang = 'fr';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = dictionaries[lang][element.dataset.i18n] || dictionaries.fr[element.dataset.i18n];
      if (value) element.innerHTML = value;
    });
    localStorage.setItem('covoiturini-lang', lang);
  };
  const select = document.querySelector('[data-language]');
  const initial = localStorage.getItem('covoiturini-lang') || 'fr';
  if (select) {
    select.value = initial;
    select.addEventListener('change', event => setLanguage(event.target.value));
  }
  setLanguage(initial);
})();
