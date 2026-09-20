const PUBLIC_HUB_FILE=/^(?:0[1-9]|[12][0-9]|3[0-2])-[^/]+\.html$/i;
export function isPublicHubFile(fileName){return PUBLIC_HUB_FILE.test(String(fileName||''));}
export function hubPublicPathForFile(fileName){
  const file=String(fileName||'');
  if(!isPublicHubFile(file))return null;
  if(file==='01-accueil.html')return '/';
  return `/${file.replace(/^\d{2}-/,'').replace(/\.html$/i,'')}`;
}
export function hubCanonicalUrlForFile(fileName){
  const p=hubPublicPathForFile(fileName);
  return p==null?null:`https://editions.lesmotsimages.com${p}`;
}
