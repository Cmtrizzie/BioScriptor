import { useEffect, useRef } from "react";

interface MolecularViewerProps {
  pdbId?: string;
  pdbData?: string;
}

export default function MolecularViewer({ pdbId, pdbData }: MolecularViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    // TODO: Implement NGL.js 3D molecular viewer
    // For now, show a placeholder
    console.log('Loading molecular viewer for:', pdbId || 'custom data');
    
    // This would be replaced with actual NGL.js implementation:
    // import { Stage } from 'ngl';
    // const stage = new Stage(viewerRef.current);
    // if (pdbId) {
    //   stage.loadFile(`rcsb://${pdbId}`).then(component => {
    //     component.addRepresentation('cartoon');
    //     component.autoView();
    //   });
    // }
  }, [pdbId, pdbData]);

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center mb-4 relative overflow-hidden">
      {/* Simulated 3D protein structure */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 opacity-20"></div>
      <div className="text-center z-10" ref={viewerRef}>
        <div className="w-16 h-16 bg-bio-teal/20 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-8 h-8 text-bio-teal animate-spin" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Loading 3D Protein Structure</p>
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          {pdbId ? `PDB: ${pdbId}` : 'Custom Structure'}
        </p>
      </div>
      
      {/* Simulated molecular structure elements */}
      <div className="absolute top-4 left-4 w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
      <div className="absolute top-8 right-6 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-6 left-8 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-4 right-4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
    </div>
  );
}
