import { useEffect, useState } from 'react';

interface ThemeColors {
  [key: string]: string;
}

interface Theme {
  name: string;
  type: 'dark' | 'light';
  colors: ThemeColors;
}

const themes: Theme[] = [
  {
    name: 'Mocha',
    type: 'dark',
    colors: {
      '--matchina-base': '#1e1e2e',
      '--matchina-mantle': '#181825',
      '--matchina-crust': '#11111b',
      '--matchina-text': '#cdd6f4',
      '--matchina-subtext1': '#bac2de',
      '--matchina-subtext0': '#a6adc8',
      '--matchina-overlay0': '#6c7086',
      '--matchina-surface0': '#313244',
      '--matchina-surface1': '#45475a',
      '--matchina-surface2': '#585b70',
      '--matchina-blue': '#89b4fa',
      '--matchina-sky': '#89dceb',
      '--matchina-sapphire': '#74c7ec',
      '--matchina-green': '#a6e3a1',
      '--matchina-teal': '#94e2d5',
      '--matchina-red': '#f38ba8',
      '--matchina-yellow': '#f9e2af',
      '--matchina-peach': '#fab387',
      '--matchina-mauve': '#cba6f7',
      '--matchina-pink': '#f5c2e7',
      '--matchina-rosewater': '#f5e0dc',
      '--matchina-flamingo': '#f2cdcd',
    }
  },
  {
    name: 'Latte', 
    type: 'light',
    colors: {
      '--matchina-base': '#eff1f5',
      '--matchina-mantle': '#e6e9ef',
      '--matchina-crust': '#dce0e8',
      '--matchina-text': '#4c4f69',
      '--matchina-subtext1': '#5c5f77',
      '--matchina-subtext0': '#6c6f85',
      '--matchina-overlay0': '#9ca0b0',
      '--matchina-surface0': '#ccd0da',
      '--matchina-surface1': '#bcc0cc',
      '--matchina-surface2': '#acb0be',
      '--matchina-blue': '#1e66f5',
      '--matchina-sky': '#04a5e5',
      '--matchina-sapphire': '#209fb5',
      '--matchina-green': '#40a02b',
      '--matchina-teal': '#179299',
      '--matchina-red': '#d20f39',
      '--matchina-yellow': '#df8e1d',
      '--matchina-peach': '#fe640b',
      '--matchina-mauve': '#8839ef',
      '--matchina-pink': '#ea76cb',
      '--matchina-rosewater': '#dc8a78',
      '--matchina-flamingo': '#dd7878',
    }
  },
  {
    name: 'Frappé',
    type: 'dark', 
    colors: {
      '--matchina-base': '#303446',
      '--matchina-mantle': '#292c3c',
      '--matchina-crust': '#232634',
      '--matchina-text': '#c6d0f5',
      '--matchina-subtext1': '#b5bfe2',
      '--matchina-subtext0': '#a5adce',
      '--matchina-overlay0': '#636880',
      '--matchina-surface0': '#414559',
      '--matchina-surface1': '#51576d',
      '--matchina-surface2': '#626880',
      '--matchina-blue': '#8caaee',
      '--matchina-sky': '#99d1db',
      '--matchina-sapphire': '#85c1dc',
      '--matchina-green': '#a6d189',
      '--matchina-teal': '#81c8be',
      '--matchina-red': '#e78284',
      '--matchina-yellow': '#e5c890',
      '--matchina-peach': '#ef9f76',
      '--matchina-mauve': '#ca9ee6',
      '--matchina-pink': '#f4b8e4',
      '--matchina-rosewater': '#f2d5cf',
      '--matchina-flamingo': '#eebebe',
    }
  },
  {
    name: 'Macchiato',
    type: 'dark',
    colors: {
      '--matchina-base': '#24273a',
      '--matchina-mantle': '#1e2030', 
      '--matchina-crust': '#181926',
      '--matchina-text': '#cad3f5',
      '--matchina-subtext1': '#b8cfe4',
      '--matchina-subtext0': '#a5adc8',
      '--matchina-overlay0': '#6e738d',
      '--matchina-surface0': '#363a4f',
      '--matchina-surface1': '#494d64',
      '--matchina-surface2': '#5b6078',
      '--matchina-blue': '#8aadf4',
      '--matchina-sky': '#91d7e3',
      '--matchina-sapphire': '#7dc4e4',
      '--matchina-green': '#a6da95',
      '--matchina-teal': '#8bd5ca',
      '--matchina-red': '#ed8796',
      '--matchina-yellow': '#eed49f',
      '--matchina-peach': '#f5a97f',
      '--matchina-mauve': '#c6a0f6',
      '--matchina-pink': '#f5bde6',
      '--matchina-rosewater': '#f4dbd6',
      '--matchina-flamingo': '#f0c6c6',
    }
  }
];

const colorCategories = {
  'Base Colors': ['base', 'mantle', 'crust'],
  'Text Colors': ['text', 'subtext1', 'subtext0', 'overlay0'],
  'Surface Colors': ['surface0', 'surface1', 'surface2'],
  'Blue Family': ['blue', 'sky', 'sapphire'],
  'Green Family': ['green', 'teal'],
  'Red Family': ['red', 'yellow', 'peach'],
  'Purple Family': ['mauve', 'pink', 'rosewater', 'flamingo'],
};

const semanticMappings = {
  'State Active': 'blue',
  'State Initial': 'green', 
  'State Final': 'red',
  'State Ancestor': 'blue-transparent',
  'Transition Available': 'blue',
  'Transition Hover': 'sky',
  'Transition Recent': 'yellow',
  'Success': 'green',
  'Warning': 'peach',
  'Error': 'red',
  'Info': 'teal',
};

export default function MatchinaColorPalette() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0]);
  const [copiedColor, setCopiedColor] = useState<string>('');
  const [showSemantic, setShowSemantic] = useState(false);

  const copyToClipboard = async (color: string) => {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(''), 2000);
  };

  const getColorValue = (colorName: string) => {
    const cssVar = `--matchina-${colorName}`;
    return selectedTheme.colors[cssVar] || '';
  };

  const ColorSwatch = ({ name, value, size = 'normal' }: { name: string; value: string; size?: 'small' | 'normal' | 'large' }) => {
    const sizeClasses = {
      small: 'w-12 h-12 text-xs',
      normal: 'w-16 h-16 text-sm', 
      large: 'w-20 h-20 text-base'
    };

    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg border-2 border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 relative`}
        style={{ backgroundColor: value }}
        onClick={() => copyToClipboard(value)}
        title={`Click to copy ${value}`}
      >
        <div className={`text-center font-mono font-semibold ${size === 'small' ? 'text-xs' : 'text-sm'}`} 
             style={{ color: selectedTheme.type === 'dark' ? '#fff' : '#000', textShadow: selectedTheme.type === 'dark' ? '0 0 4px rgba(0,0,0,0.8)' : '0 0 4px rgba(255,255,255,0.8)' }}>
          {name}
        </div>
        {copiedColor === value && (
          <div className="absolute -top-8 bg-green-500 text-white text-xs px-2 py-1 rounded">
            Copied!
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Theme Selector */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Select Theme</h2>
        <div className="flex gap-4 flex-wrap">
          {themes.map((theme) => (
            <button
              key={theme.name}
              onClick={() => setSelectedTheme(theme)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTheme.name === theme.name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {theme.name} ({theme.type})
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setShowSemantic(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showSemantic
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Color Categories
          </button>
          <button
            onClick={() => setShowSemantic(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showSemantic
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Semantic Usage
          </button>
        </div>
      </div>

      {/* Color Display */}
      {!showSemantic ? (
        <div className="space-y-8">
          {Object.entries(colorCategories).map(([category, colors]) => (
            <div key={category}>
              <h3 className="text-xl font-semibold mb-3">{category}</h3>
              <div className="flex gap-4 flex-wrap">
                {colors.map((colorName) => {
                  const value = getColorValue(colorName);
                  return value ? (
                    <div key={colorName} className="text-center">
                      <ColorSwatch name={colorName} value={value} />
                      <div className="mt-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {value}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">Semantic Color Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(semanticMappings).map(([semantic, colorName]) => {
              const value = getColorValue(colorName.replace('-transparent', ''));
              const isTransparent = colorName.includes('-transparent');
              
              return value ? (
                <div key={semantic} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="font-medium mb-2">{semantic}</div>
                  <div className="flex items-center gap-4">
                    <ColorSwatch 
                      name={colorName} 
                      value={isTransparent ? value + '33' : value} 
                      size="small"
                    />
                    <div>
                      <div className="font-mono text-sm">{isTransparent ? value + '33' : value}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Uses: {colorName}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Theme Preview */}
      <div className="mt-12 p-6 rounded-lg border border-gray-200 dark:border-gray-700" 
           style={{ backgroundColor: getColorValue('base'), color: getColorValue('text') }}>
        <h3 className="text-xl font-semibold mb-4">Theme Preview</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="px-4 py-2 rounded font-medium" 
                 style={{ backgroundColor: getColorValue('blue'), color: getColorValue('base') }}>
              Active State
            </div>
            <div className="px-4 py-2 rounded font-medium" 
                 style={{ backgroundColor: getColorValue('green'), color: getColorValue('base') }}>
              Initial State
            </div>
            <div className="px-4 py-2 rounded font-medium" 
                 style={{ backgroundColor: getColorValue('red'), color: getColorValue('base') }}>
              Final State
            </div>
          </div>
          <div className="p-4 rounded-lg border-2" 
               style={{ borderColor: getColorValue('surface1'), backgroundColor: getColorValue('mantle') }}>
            <div className="font-medium mb-2">Container Example</div>
            <div className="text-sm" style={{ color: getColorValue('subtext1') }}>
              This is how nested containers look with the theme.
            </div>
          </div>
        </div>
      </div>

      {/* CSS Variables Reference */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">CSS Variables</h3>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <pre className="text-sm font-mono overflow-x-auto">
{`:root[data-theme="${selectedTheme.name.toLowerCase()}"] {`}
{Object.entries(selectedTheme.colors).map(([key, value]) => 
  `  ${key}: ${value};`
).join('\n')}
{`}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
