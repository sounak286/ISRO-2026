# Terrae Reference & Documentation Cheat Sheet

This document serves as a comprehensive reference guide for **Terrae** (pronounced *TER-ray*), an open-source library of beautifully designed, animated, accessible, and customizable React map components. Built on top of **Mapbox GL JS** and **MapLibre GL JS**, styled with **Tailwind CSS**, and designed as a stylistic companion to **shadcn/ui**, it replaces imperative mapping boilerplate with clean, declarative React components.

---

## 1. Installation & Setup

### Prerequisites
A React project with **Tailwind CSS** and **shadcn/ui** already configured.

### Registry Installation
Terrae components are designed to be added directly to your project codebase using the `shadcn/ui` registry.

```bash
# 1. Install the base Map component
npx shadcn@latest add https://www.terrae.dev/map.json

# 2. Add other components as needed (dependencies are automatically resolved)
npx shadcn@latest add https://www.terrae.dev/marker.json
npx shadcn@latest add https://www.terrae.dev/controls.json
npx shadcn@latest add https://www.terrae.dev/compass.json
npx shadcn@latest add https://www.terrae.dev/marker-animated.json
npx shadcn@latest add https://www.terrae.dev/animated-footprint.json
npx shadcn@latest add https://www.terrae.dev/popup.json
```

*(Note: Once [shadcn-ui/ui/pull/9358](https://github.com/shadcn-ui/ui/pull/9358) is approved, a shorter installation syntax will be available: `npx shadcn@latest add terrae/map`)*

---

### Configuration: Mapbox GL vs MapLibre GL

#### Option A: Mapbox GL JS (Default)
To use Mapbox GL JS, obtain a public access token from [Mapbox Account](https://account.mapbox.com/access-tokens/) and add it to your `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

#### Option B: MapLibre GL JS (Free, Open-Source Alternative)
To switch to MapLibre GL, first install the MapLibre variant of the base map:
```bash
npx shadcn@latest add https://www.terrae.dev/maplibre.json
```
If you previously installed the Mapbox variant, install the packages manually:
```bash
npm install maplibre-gl
npm install -D @types/mapbox-gl
```
Then update `map-library.ts` to replace the map library engine:
```typescript
// map-library.ts
import mapboxgl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

const detectedLibrary: MapLibraryName = "maplibre"
const mapgl = mapboxgl

export { mapgl, detectedLibrary }
```
*Note: No access token is needed when using MapLibre GL. However, certain Mapbox-exclusive features (like the Rain Effect and Standard 3D styles) are not supported on MapLibre.*

---

## 2. Declarative Anatomy vs Raw Mapbox GL

### Imperative Approach (Without Terrae)
```tsx
import mapboxgl from 'mapbox-gl';
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-74.006, 40.7128],
  zoom: 12,
});

map.on('load', () => {
  const el = document.createElement('div');
  el.style.width = '32px'; el.style.height = '32px';
  el.style.backgroundImage = 'url(marker.png)';
  
  const marker = new mapboxgl.Marker(el)
    .setLngLat([-74.006, 40.7128])
    .addTo(map);

  const popup = new mapboxgl.Popup({ offset: 25 })
    .setLngLat([-74.006, 40.7128])
    .setHTML('<h3>New York City</h3><p>The city that never sleeps</p>');

  el.addEventListener('click', () => popup.addTo(map));

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-74.006, 40.7128], [-73.9857, 40.7484]] }
    }
  });

  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    paint: { 'line-color': '#3b82f6', 'line-width': 4 }
  });

  map.addControl(new mapboxgl.NavigationControl());
});
```

### Declarative Approach (With Terrae)
```tsx
import { Map, MapMarker, MarkerContent, MarkerPopup, MapLine, MapControls, MapZoom, MapFullscreen } from "@/registry/map";

export function MyMap() {
  const route = [
    [-74.006, 40.7128],
    [-73.9857, 40.7484],
  ];

  return (
    <Map
      accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!}
      center={[-74.006, 40.7128]}
      zoom={12}
    >
      <MapMarker coordinates={[-74.006, 40.7128]}>
        <MarkerContent>
          <div className="size-8 rounded-full bg-blue-500 shadow-lg" />
        </MarkerContent>
        <MarkerPopup>
          <h3>New York City</h3>
          <p>The city that never sleeps</p>
        </MarkerPopup>
      </MapMarker>

      <MapLine coordinates={route} color="#3b82f6" width={4} />

      <MapControls position="bottom-right">
        <MapZoom />
        <MapFullscreen />
      </MapControls>
    </Map>
  );
}
```

---

## 3. Component Anatomy

The general composability layout is as follows:
```tsx
<Map>
  {/* Annotations & Markers */}
  <MapMarker coordinates={[lng, lat]}>
    <MarkerContent>
      <MarkerLabel position="top">Label</MarkerLabel>
      <MarkerAvatar src="..." online={true} />
      <MarkerAvatarPin src="..." />
    </MarkerContent>
    <MarkerPopup closeButton={false}>Popup HTML</MarkerPopup>
    <MarkerTooltip>Tooltip Content</MarkerTooltip>
  </MapMarker>
  <MapMarkerAnimated id="animated" path={[[lng, lat], ...]} />

  {/* Popup */}
  <MapPopup coordinates={[lng, lat]} />

  {/* Controls & MiniMap */}
  <MapControls position="bottom-right">
    <MapZoom />
    <MapOrientation />
    <MapGeolocate onLocate={(coords) => console.log(coords)} />
    <MapFullscreen />
  </MapControls>
  <MapCompass position="top-right" showBearing={true} />
  <MapMiniMap position="bottom-left" boxColor="#3b82f6" />

  {/* Geometries */}
  <MapLine coordinates={[[lng, lat], ...]} />
  <MapPolygon coordinates={[[lng, lat], ...]} fillColor="#3b82f6" />
  <MapCircle center={[lng, lat]} radius={1000} />
  
  {/* Data Visualization */}
  <MapCircleCluster data={geoJsonData} />
  <MapChoropleth data={geoJsonData} valueProperty="density" colorScale={colorScale} />

  {/* Advanced Animations */}
  <MapAnimatedCircle id="zone" center={[lng, lat]} radius={1000} />
  <MapLineAnimated id="route" path={[[lng, lat], ...]} />
  <MapLineRadial id="radial" origin={[lng, lat]} destinations={[[lng, lat], ...]} />
  <MapArcAnimated id="arc" origin={[lng, lat]} destination={[lng, lat]} />
  <MapCameraFollow path={[[lng, lat], ...]} marker={true} />
  <MapAnimatedPolygon id="zone" coordinates={[[lng, lat], ...]} />
  <MapAnimatedPulse id="pulse" size={100} coordinates={[lng, lat]} />
  <MapAnimatedFootprint path={[[lng, lat], ...]} />

  {/* Media Overlays */}
  <MapImage id="overlay" url="..." coordinates={[...]} />
  <MapRasterVideo id="video" urls={[...]} coordinates={[...]} />
  <MapMusicDisc coordinates={[lng, lat]} />

  {/* Visual FX & Utilities */}
  <MapBlurArea coordinates={[[lng, lat], ...]} />
  <MapTargetingReticle coordinates={[lng, lat]} />
  <MapRadar id="radar" coordinates={[lng, lat]} />
  <MapWatermark>TERRAE</MapWatermark>
  <MapGrid />

  {/* Atmospheric & Weather Effects */}
  <MapRain density={0.5} />
  <MapSnow intensity={1.0} />
  <MapSandstorm intensity={1.0} />
  <MapFire id="fire" coordinates={[lng, lat]} />
  <MapExplosion id="explosion" coordinates={[lng, lat]} />
  <MapCyclone id="cyclone" coordinates={[lng, lat]} />
  <MapMeteor id="meteor" target={[lng, lat]} />
  <MapLightning id="lightning" coordinates={[lng, lat]} />
  <MapSteam id="steam" coordinates={[lng, lat]} />
  <MapTsunami id="tsunami" origin={[lng, lat]} target={[lng, lat]} />
</Map>
```

---

## 4. Master Props Reference


## Map

The root container that initializes the map and provides context to all child components. Supports both Mapbox GL JS and MapLibre GL JS. Automatically handles theme switching between light and dark modes.

Extends [MapOptions](https://docs.mapbox.com/mapbox-gl-js/api/map/#map-parameters) from Mapbox GL (excluding container and style).
PropTypeDefaultDescriptionaccessTokenstring—Mapbox access token. Required.childrenReactNode—Child components (markers, popups, controls, features).center[number, number][0, 0]Initial map center [longitude, latitude].zoomnumber2Initial zoom level.bearingnumber0Map bearing (rotation) in degrees.pitchnumber0Map pitch (tilt) in degrees.projectionstring"mercator"Map projection: mercator, globe, albers, equalEarth, equirectangular, lambertConformalConic, naturalEarth, winkelTripel.stylestring—Map style URL (e.g., 'mapbox://styles/mapbox/streets-v12'). Overrides theme-based styles.stylesMapThemeStylesdefaultMapStylesTheme-aware styles object. Use presets: defaultMapStyles, standardMapStyles, streetsMapStyles, outdoorsMapStyles, satelliteMapStyles, navigationMapStyles.minZoomnumber0Minimum zoom level constraint.maxZoomnumber22Maximum zoom level constraint.maxBounds[[number, number], [number, number]]—Restrict map panning to a geographic area [southwest, northeast].loaderReactNode—Custom loading component shown while map initializes.showLoaderboolean—Controls loader visibility. When true, forces loader. When false, hides. When undefined, uses internal loading state.autoRotatebooleanfalseEnables automatic rotation. Only works with projection="globe".rotateSpeednumber3Rotation speed in degrees per second when autoRotate is enabled.

## MapControls

Container for map control components. Accepts composable control components as children (MapZoom, MapOrientation, MapGeolocate, MapFullscreen). Must be used inside Map.
PropTypeDefaultDescriptionposition"top-left" | "top-right" | "bottom-left" | "bottom-right""bottom-right"Position of the controls on the map.childrenReactNode—Control components (MapZoom, MapOrientation, MapGeolocate, MapFullscreen).classNamestring—Additional CSS classes for the controls container.

## MapZoom

Zoom in and zoom out control buttons. Must be used inside MapControls.

No props required.

## MapOrientation

Compass control that shows map orientation and resets bearing to north when clicked. Must be used inside MapControls.

No props required.

## MapGeolocate

Geolocate control to find and fly to user's current location. Must be used inside MapControls.
PropTypeDefaultDescriptiononLocate(coords: { longitude: number; latitude: number }) => void—Callback with user coordinates when located.

## MapFullscreen

Fullscreen toggle control. Must be used inside MapControls.

No props required.

## MapCompass

Interactive compass with drag-to-rotate functionality. Dragging the compass rotates the map bearing. Must be used inside Map.
PropTypeDefaultDescriptionsize"sm" | "md" | "lg" | "xl" | number"md"Compass size. T-shirt sizes map to 48, 64, 80, 96 pixels respectively.position"top-left" | "top-right" | "bottom-left" | "bottom-right""top-right"Position of the compass on the map.showCardinalsbooleantrueShow N, S, E, W cardinal direction labels.showRingbooleantrueShow outer ring with degree tick marks.showBearingbooleanfalseDisplay current bearing in degrees below the compass.autoRotatebooleanfalseEnable automatic rotation of the compass.autoRotateSpeednumber2Speed of auto rotation in degrees per frame.classNamestring—Additional CSS classes for the wrapper element.

## MapMarker

A container for marker-related components. Provides context for its children and handles marker positioning.

Extends [MarkerOptions](https://docs.mapbox.com/mapbox-gl-js/api/markers/#marker-parameters) from Mapbox GL (excluding element).
PropTypeDefaultDescriptioncoordinates[number, number]—Coordinates [longitude, latitude] for marker position.childrenReactNode—Marker subcomponents (MarkerContent, MarkerPopup, etc).onClick(e: MouseEvent) => void—Callback when marker is clicked.onMouseEnter(e: MouseEvent) => void—Callback when mouse enters marker.onMouseLeave(e: MouseEvent) => void—Callback when mouse leaves marker.onDragStart(lngLat: LngLatCoordinates) => void—Callback when marker drag starts (requires draggable: true).onDrag(lngLat: LngLatCoordinates) => void—Callback during marker drag (requires draggable: true).onDragEnd(lngLat: LngLatCoordinates) => void—Callback when marker drag ends (requires draggable: true).

## MarkerContent

Renders the visual content of a marker. Must be used inside MapMarker. If no children provided, renders a default blue dot marker.
PropTypeDefaultDescriptionchildrenReactNode—Custom marker content. Defaults to a blue dot.classNamestring—Additional CSS classes for the marker container.

## MarkerPopup

Renders a popup attached to the marker that opens on click. Must be used inside MapMarker.

Extends [PopupOptions](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup-parameters) from Mapbox GL (excluding className and closeButton).
The className and closeButton from Mapbox's PopupOptions are excluded to prevent style conflicts. Use the component's own props to style the popup. Mapbox's default popup styles are reset via CSS.PropTypeDefaultDescriptionchildrenReactNode—Popup content.classNamestring—Additional CSS classes for the popup container.closeButtonbooleanfalseShow a close button in the popup.

## MarkerTooltip

Renders a tooltip that appears on hover. Must be used inside MapMarker.

Extends [PopupOptions](https://mapbox.com/maplibre-gl-js/docs/API/type-aliases/PopupOptions/) from Mapbox GL (excluding className, closeButton, and closeOnClick as tooltips auto-dismiss on hover out).
The className from Mapbox's PopupOptions is excluded to prevent style conflicts. Use the component's own className prop to style the tooltip content. Mapbox's default popup styles are reset via CSS.PropTypeDefaultDescriptionchildrenReactNode—Tooltip content.classNamestring—Additional CSS classes for the tooltip container.

## MarkerLabel

Renders a text label above or below the marker. Must be used inside MarkerContent.
PropTypeDefaultDescriptionchildrenReactNode—Label text content.classNamestring—Additional CSS classes for the label.position"top" | "bottom""top"Position of the label relative to the marker.

## MapPopup

A standalone popup component that can be placed anywhere on the map without a marker. Must be used inside Map.

Extends [PopupOptions](https://docs.mapbox.com/mapbox-gl-js/api/markers/#popup-parameters) from Mapbox GL (excluding className and closeButton).
The className and closeButton from Mapbox's PopupOptions are excluded to prevent style conflicts. Use the component's own props to style the popup. Mapbox's default popup styles are reset via CSS.PropTypeDefaultDescriptioncoordinates[number, number]—Coordinates [longitude, latitude] for popup position.onClose() => void—Callback when popup is closed.childrenReactNode—Popup content.classNamestring—Additional CSS classes for the popup container.closeButtonbooleanfalseShow a close button in the popup.

## MapMarkerAnimated

Renders an animated marker that moves along a path. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the animated marker.coordinates[number, number][]—Array of [longitude, latitude] pairs defining the path.colorstring"#3b82f6"Marker color.sizenumber10Marker radius in pixels.durationnumber5000Animation duration in milliseconds.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop animation continuously.showPathbooleanfalseShow the path/route line.pathColorstring"#3b82f6"Path line color.pathWidthnumber4Path line width in pixels.onComplete() => void—Callback when animation completes.

## MapLine

Renders a line on the map connecting coordinate points. Must be used inside Map.
PropTypeDefaultDescriptioncoordinates[number, number][]—Array of [longitude, latitude] coordinate pairs.colorstring"#4285F4"Line color (CSS color value).widthnumber3Line width in pixels.opacitynumber0.8Line opacity (0 to 1).dashArray[number, number]—Dash pattern [dash length, gap length] for dashed lines.

## MapPolygon

Renders a filled polygon on the map. Must be used inside Map.
PropTypeDefaultDescriptioncoordinates[number, number][]—Array of [longitude, latitude] coordinate pairs defining the polygon vertices.fillColorstring"#3b82f6"Fill color of the polygon.fillOpacitynumber0.4Fill opacity (0 to 1).strokeColorstring"#3b82f6"Stroke/outline color.strokeWidthnumber2Stroke width in pixels.strokeOpacitynumber1Stroke opacity (0 to 1).dashArray[number, number]—Dash pattern [dash length, gap length] for dashed strokes.

## MapCircle

Renders a geographic circle on the map with a center point and radius in meters. Must be used inside Map.
PropTypeDefaultDescriptioncenter[number, number]—Center point [longitude, latitude] of the circle.radiusnumber—Radius of the circle in meters.fillColorstring"#3b82f6"Fill color of the circle.fillOpacitynumber0Fill opacity (0 to 1).strokeColorstring"#3b82f6"Stroke/outline color.strokeWidthnumber2Stroke width in pixels.strokeOpacitynumber1Stroke opacity (0 to 1).dashArray[number, number]—Dash pattern [dash length, gap length] for dashed strokes.segmentsnumber64Number of segments for circle smoothness.draggablebooleanfalseEnable dragging to reposition the circle.cursorstring"grab"Cursor style when hovering over draggable circle.onDragStart(center: [number, number]) => void—Callback when drag begins.onDrag(center: [number, number]) => void—Callback during drag with new center coordinates.onDragEnd(center: [number, number]) => void—Callback when drag ends with final center coordinates.

## MapAnimatedCircle

Renders an animated circle with drawing outline and fill effects. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the animated circle.center[number, number]—Center point [longitude, latitude] of the circle.radiusnumber—Radius of the circle in meters.strokeColorstring"#3b82f6"Color of the circle outline.strokeWidthnumber2Width of the circle outline in pixels.strokeOpacitynumber1Opacity of the circle outline (0-1).strokeDashArraynumber[]-Dash pattern [dash, gap] for dashed outline effect.fillColorstring"#3b82f6"Color of the circle fill.fillOpacitynumber0.3Target opacity of the circle fill (0-1).durationnumber2000Duration of outline drawing animation in milliseconds.fillDurationnumber1000Duration of fill animation in milliseconds.animationMode"draw" | "fill""draw"Animation mode: outline only or outline then fill.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the animation continuously.loopDelaynumber1000Delay before restarting loop in milliseconds.segmentsnumber64Number of segments for circle smoothness.onDrawComplete() => void—Callback when outline drawing completes.onFillComplete() => void—Callback when fill animation completes.onComplete() => void—Callback when entire animation completes.

## MapCircleCluster

Renders clustered point data using Mapbox GL's native clustering. Automatically groups nearby points into clusters that expand on click. Must be used inside Map. Supports a generic type parameter for typed feature properties: MapCircleCluster<MyProperties>.
PropTypeDefaultDescriptiondatastring | GeoJSON.FeatureCollection—GeoJSON FeatureCollection data or URL to fetch GeoJSON from.clusterMaxZoomnumber14Maximum zoom level to cluster points on.clusterRadiusnumber50Radius of each cluster when clustering points (in pixels).clusterColors[string, string, string]["#51bbd6", "#f1f075", "#f28cb1"]Colors for cluster circles: [small, medium, large] based on point count.clusterThresholds[number, number][100, 750]Point count thresholds for color/size steps: [medium, large].pointColorstring"#3b82f6"Color for unclustered individual points.onPointClick(feature: GeoJSON.Feature, coordinates: [number, number]) => void—Callback when an unclustered point is clicked.onClusterClick(clusterId: number, coordinates: [number, number], pointCount: number) => void—Callback when a cluster is clicked. If not provided, zooms into the cluster.

## MapChoropleth

Colors geographic regions based on data values. Supports GeoJSON data with Polygon or MultiPolygon features. Must be used inside Map. Supports a generic type parameter for typed feature properties: MapChoropleth<MyProperties>.
PropTypeDefaultDescriptiondatastring | GeoJSON.FeatureCollection—GeoJSON URL or FeatureCollection with Polygon/MultiPolygon features.valuePropertystring—Property name in feature.properties to use for coloring.colorScaleChoroplethColorScale—Color scale configuration: { stops: [{ value, color }], interpolation?: 'linear' | 'step', nullColor? }.fillOpacitynumber0.8Fill opacity (0-1).strokeColorstring"#ffffff"Border color between regions.strokeWidthnumber2Border width in pixels.strokeOpacitynumber1Border opacity (0-1).hoverEnabledbooleanfalseEnable hover highlighting effect.hoverFillOpacitynumber1Fill opacity when hovered.hoverStrokeColorstring"#000000"Border color when hovered.hoverStrokeWidthnumber4Border width when hovered.onClick(event: ChoroplethClickEvent) => void—Callback when a region is clicked. Event includes feature, value, and coordinates.onHover(event: ChoroplethHoverEvent) => void—Callback when hovering over regions. Event includes feature, value, and coordinates.

## MapAnimatedPulse

Renders an animated pulsing dot at specified coordinates. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the pulse animation.sizenumber—Pulse size in pixels.coordinates[number, number]—Coordinates [longitude, latitude] for pulse position.colorstring"rgba(0, 100, 255, 1)"Inner circle color.pulseColorstring"rgba(0, 100, 255, 0.8)"Outer pulsing circle color.durationnumber1000Animation duration in milliseconds.

## MapAnimatedPolygon

Renders an animated polygon with drawing outline and fill effects. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the polygon.coordinates[number, number][]—Array of [longitude, latitude] pairs defining polygon vertices.strokeColorstring"#3b82f6"Color of the polygon outline.strokeWidthnumber2Width of the polygon outline in pixels.strokeOpacitynumber1Opacity of the polygon outline (0-1).fillColorstring"#3b82f6"Color of the polygon fill.fillOpacitynumber0.3Target opacity of the polygon fill (0-1).durationnumber2000Duration of outline drawing animation in milliseconds.fillDurationnumber1000Duration of fill animation in milliseconds.animationMode"draw" | "fill" | "draw-then-fill""draw-then-fill"Animation sequence mode.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the animation continuously.loopDelaynumber1000Delay before restarting loop in milliseconds.onDrawComplete() => void—Callback when outline drawing completes.onFillComplete() => void—Callback when fill animation completes.onComplete() => void—Callback when entire animation completes.

## MapMiniMap

Displays an overview minimap showing the current viewport context. Must be used inside Map.
PropTypeDefaultDescriptionposition"top-left" | "top-right" | "bottom-left" | "bottom-right""bottom-right"Position of the minimap on the map.widthnumber200Minimap width in pixels.heightnumber150Minimap height in pixels.zoomOffsetnumber-4Zoom offset relative to main map.stylestring—Custom map style URL for the minimap. Overrides theme-based styles.stylesMapThemeStyles—Theme-aware styles object with light/dark variants. Automatically switches based on theme.boxColorstring"#3b82f6"Color of the viewport box outline.boxBorderWidthnumber2Width of the viewport box border.roundednumber | "full" | "none"8Border radius in pixels, "full" for circular, or "none".draggablebooleanfalseAllow users to drag the minimap anywhere within the map.

## MapBlurArea

Renders blur effect overlays on specified areas of the map. Supports single or multiple areas. Must be used inside Map.
PropTypeDefaultDescriptioncoordinates[number, number][]—Array of [longitude, latitude] coordinate pairs defining a single blur area.areasBlurAreaConfig[]—Array of blur area configs for multiple regions. Each config: { coordinates, blur?, backgroundColor?, rounded? }.blurnumber8Default blur intensity in pixels.backgroundColorstring—Default background color overlay (e.g., "rgba(0,0,0,0.3)").roundednumber | "full"0Default border radius in pixels or "full" for circular.blockInteractionbooleanfalsePrevent map interactions on blur areas.

## MapTargetingReticle

Renders a targeting reticle overlay with corner brackets that can track and lock onto targets. Must be used inside Map.
PropTypeDefaultDescriptioncoordinates[number, number]—Current reticle position [longitude, latitude].target[number, number]—Target coordinates to track towards.sizenumber120Reticle size in pixels.bracketLengthnumber24Length of corner brackets in pixels.bracketThicknessnumber2Thickness of corner brackets in pixels.gapnumber8Gap between brackets and reticle edge in pixels.colorstring"rgba(59, 130, 246, 0.9)"Default reticle color.lockedColorstring"rgba(34, 197, 94, 0.9)"Color when locked on target.lockedbooleanfalseWhether the reticle is locked on target.trackingSpeednumber0.02Speed of tracking interpolation (0-1).showCrosshairbooleantrueShow crosshair lines in the center.showCoordinatesbooleanfalseDisplay coordinates below the reticle.onLocked() => void—Callback when reticle locks onto target.

## MapLineAnimated

Renders an animated line that draws progressively along the route. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the animated line.pathArray<[number, number]>—Array of [longitude, latitude] coordinate pairs.colorstring"#3b82f6"Line color.widthnumber4Line width in pixels.opacitynumber1Line opacity (0 to 1).dashArray[number, number]—Dash pattern [dash length, gap length] for dashed lines.durationnumber3000Animation duration in milliseconds.showMarkerbooleantrueWhether to show a marker moving along the line.markerColorstring"#3b82f6"Marker color.markerIconReactNode—Custom marker icon (React component).markerBorderlessbooleanfalseRemove border/outline from marker.autoStartbooleantrueAuto-start animation on mount.loopbooleanfalseLoop animation continuously.onComplete() => void—Callback when animation completes.

## MapLineRadial

Renders animated curved lines spreading from a central origin to multiple destinations. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the radial lines.origin[number, number]—Origin coordinates [longitude, latitude].destinationsRadialDestination[]—Array of destinations. Each can be [lng, lat] or { coordinates, color?, label? }.colorstring"#3b82f6"Default line color.widthnumber2Line width in pixels.opacitynumber0.8Line opacity (0 to 1).dashArray[number, number]—Dash pattern [dash length, gap length] for dashed lines.curvaturenumber | "auto"0.3Curve intensity (0-1) or "auto" to calculate based on distance.curveSegmentsnumber50Number of segments for smooth curves.durationnumber2000Animation duration per line in milliseconds.staggerDelaynumber200Delay between starting each line animation.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the animation continuously.loopDelaynumber1000Delay before restarting loop in milliseconds.showOriginMarkerbooleantrueShow marker at origin point.originMarkerColorstring"#ef4444"Origin marker color.originMarkerIconReactNode—Custom origin marker icon.originMarkerPulsebooleantrueShow pulse animation on origin marker.showDestinationMarkersbooleantrueShow markers at destination points.destinationMarkerColorstring—Destination marker color (defaults to line color).destinationMarkerIconReactNode—Custom destination marker icon.showTravelingMarkerbooleanfalseShow marker traveling along the active line.travelingMarkerColorstring—Traveling marker color (defaults to line color).travelingMarkerIconReactNode—Custom traveling marker icon.onLineComplete(index: number, destination: [number, number]) => void—Callback when a line animation completes.onComplete() => void—Callback when all line animations complete.

## MapArcAnimated

Renders an animated curved arc between two points. Useful for visualizing flights, deliveries, and point-to-point connections. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the arc.origin[number, number]—Starting point coordinates [longitude, latitude].destination[number, number]—Ending point coordinates [longitude, latitude].colorstring"#3b82f6"Arc line color.widthnumber4Line width in pixels.opacitynumber1Line opacity (0 to 1).dashArray[number, number]—Dash pattern [dash length, gap length] for dashed arcs.heightnumber0.3Curve height multiplier (0 = straight line, higher = more curved).segmentsnumber50Number of segments for curve smoothness.durationnumber2000Animation duration in milliseconds.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the animation continuously.loopDelaynumber500Delay before restarting loop in milliseconds.headType"none" | "circle" | "square" | "arrow""circle"Shape of the traveling marker at the arc tip.headSizenumber16Size of the head marker in pixels.showOriginMarkerbooleanfalseShow marker at the origin point.originMarkerColorstring—Origin marker color (defaults to arc color).showDestinationMarkerbooleanfalseShow marker at destination when animation completes.destinationMarkerColorstring—Destination marker color (defaults to arc color).onComplete() => void—Callback when animation completes.

## MapCameraFollow

Animates the camera along a path of coordinates for immersive fly-through experiences. Must be used inside Map.
PropTypeDefaultDescriptionpath[number, number][]—Array of [longitude, latitude] coordinates for the camera to follow. Required.durationnumber20000Animation duration in milliseconds.zoomnumber14Camera zoom level during flight.pitchnumber60Camera tilt angle (0-85 degrees).autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the animation continuously.loopDelaynumber1000Delay before restarting loop in milliseconds.onComplete() => void—Callback when animation completes.markerboolean | ReactNode—Navigation marker. Use true for default arrow, or pass a custom React element.markerSizenumber48Size of the default navigation marker in pixels.

## MapCompare

Displays two maps side-by-side for visual comparison. This component creates its own map instances and does not require a parent Map component.
PropTypeDefaultDescriptionaccessTokenstring—Mapbox access token. Required.beforeStylestring—Map style for the before (left/top) map.afterStylestring—Map style for the after (right/bottom) map.center[number, number][0, 0]Initial map center [longitude, latitude].zoomnumber2Initial zoom level.bearingnumber0Map bearing (rotation) in degrees.pitchnumber0Map pitch (tilt) in degrees.projection"globe" | "mercator" | "naturalEarth" | "equalEarth" | "winkelTripel"—Map projection type.defaultSizenumber50Initial split position as percentage (0-100).orientation"horizontal" | "vertical""horizontal"Compare layout direction. Horizontal shows left/right, vertical shows top/bottom.showLabelsbooleanfalseShow Before/After or Top/Bottom labels on each map panel.loaderReactNode—Custom loading component.

## MapSync

Displays 2 or 4 synchronized maps where panning, zooming, or rotating one map updates all others in real-time. This component creates its own map instances and does not require a parent Map component.
PropTypeDefaultDescriptionaccessTokenstring—Mapbox access token. Required.mapsMapConfig[]—Array of 2 or 4 map configurations. Each config: { style?, styles?, label? }.layout"horizontal" | "vertical" | "grid""horizontal"Layout arrangement. Grid requires 4 maps for a 2x2 layout.center[number, number][0, 0]Initial map center [longitude, latitude].zoomnumber2Initial zoom level.bearingnumber0Map bearing (rotation) in degrees.pitchnumber0Map pitch (tilt) in degrees.projection"globe" | "mercator" | "naturalEarth" | "equalEarth" | "winkelTripel"—Map projection type.showLabelsbooleanfalseShow labels on each map panel.loaderReactNode—Custom loading component.

## MapImage

Overlays an image on the map at specified coordinates. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the image layer.urlstring—Image URL to display.coordinates[[number, number], [number, number], [number, number], [number, number]]—Four corner coordinates [topLeft, topRight, bottomRight, bottomLeft] as [lng, lat] pairs.opacitynumber1Image opacity (0 to 1).

## MapRasterVideo

Overlays video content on the map at specified coordinates. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the video layer.urlsstring[]—Array of video URLs (provide multiple formats for browser compatibility).coordinates[[number, number], [number, number], [number, number], [number, number]]—Four corner coordinates [topLeft, topRight, bottomRight, bottomLeft] as [lng, lat] pairs.opacitynumber1Video opacity (0 to 1).autoplaybooleanfalseAuto-play video on load.loopbooleantrueLoop video playback.mutedbooleantrueMute video audio.

## MapRain

Adds an animated rain weather effect overlay to the map. Requires Mapbox GL JS v3.9 or higher. Must be used inside Map.
This component requires Mapbox GL JS v3.9+. Use the createZoomInterpolation helper to create zoom-based effects.PropTypeDefaultDescriptiondensitynumber | any[]0.5Rain density (0-1) or Mapbox expression for zoom-based density.intensitynumber1.0Rain intensity (0-1).colorstring"#a8adbc"Rain droplet color.opacitynumber0.7Rain opacity (0-1).vignettenumber | any[]1.0Vignette effect strength (0-1) or Mapbox expression.vignetteColorstring"#464646"Vignette color.direction[number, number][0, 80]Wind direction [x, y].dropletSize[number, number][2.6, 18.2]Droplet size range [min, max].distortionStrengthnumber0.7Distortion strength (0-1).centerThinningnumber0Center thinning effect (0 = full screen).

## MapSnow

Adds an animated snowfall weather effect overlay to the map. Must be used inside Map.
PropTypeDefaultDescriptionintensitynumber1Snowfall intensity multiplier.particleCountnumber150Number of snowflake particles.colorstring"#ffffff"Snowflake color.windSpeednumber0.5Horizontal wind speed affecting drift.windDirectionnumber0Wind direction in degrees.fallSpeednumber1Vertical fall speed multiplier.autoStartbooleantrueStart animation automatically on mount.

## MapSandstorm

Adds an atmospheric sandstorm effect with horizontal particle movement and reduced visibility. Must be used inside Map.
PropTypeDefaultDescriptionintensitynumber1Sandstorm intensity multiplier.particleCountnumber200Number of sand particles.colorstring"#d4a574"Sand particle color.windSpeednumber4Horizontal wind speed.windDirectionnumber0Wind direction in degrees.visibilitynumber0.3Visibility level (0 = no visibility, 1 = clear).turbulencenumber0.5Turbulence amount affecting particle movement.autoStartbooleantrueStart animation automatically on mount.

## MapFire

Renders a realistic animated fire effect with particle simulation at map coordinates. Must be used inside Map. Use useFireControl hook to control programmatically.
PropTypeDefaultDescriptionidstring—Unique identifier for the fire effect.coordinates[number, number]—Coordinates [longitude, latitude] for the fire position.sizenumber120Fire canvas size in pixels.intensitynumber1Fire intensity multiplier.particleCountnumber50Number of fire particles.baseColorstring"#ffcc00"Base flame color.tipColorstring"#ff3300"Flame tip color.spreadbooleanfalseEnable fire spreading to nearby points.spreadSpeednumber2000Time between spread points in milliseconds.spreadRadiusnumber0.4Maximum spread radius as fraction of canvas size.maxSpreadPointsnumber8Maximum number of fire spread sources.autoStartbooleantrueStart animation automatically on mount.

## MapExplosion

Renders an animated explosion burst effect with radial particles and flash. Supports burst and nuclear types. Must be used inside Map. Use useExplosionControl hook to trigger programmatically.
PropTypeDefaultDescriptionidstring—Unique identifier for the explosion.coordinates[number, number]—Coordinates [longitude, latitude] for the explosion.type"burst" | "nuclear""burst"Explosion type. Nuclear creates a mushroom cloud effect.sizenumber150Explosion canvas size in pixels.particleCountnumber60Number of explosion particles.durationnumber3000Explosion duration in milliseconds.coreColorstring"#ffffff"Core flash color.outerColorstring"#ff6600"Outer explosion color.autoStartbooleantrueTrigger explosion automatically on mount.loopbooleanfalseLoop the explosion animation.loopDelaynumber3000Delay before restarting loop in milliseconds.

## MapCyclone

Renders an animated cyclone funnel with swirling particles and debris. Supports movement along a path. Must be used inside Map. Use useCycloneControl hook to control programmatically.
PropTypeDefaultDescriptionidstring—Unique identifier for the cyclone.coordinates[number, number]—Coordinates [longitude, latitude] for the cyclone position.path[number, number][]—Optional path for the cyclone to travel along.durationnumber10000Duration of path movement in milliseconds.loopbooleanfalseLoop the path movement.sizenumber200Cyclone canvas size in pixels.intensitynumber1Cyclone intensity multiplier.scalenumber1Cyclone visual scale (0.2 to 2).particleCountnumber120Number of swirling particles.funnelColorstring"#8b9dc3"Funnel particle color.debrisColorstring"#5c4033"Debris particle color.rotationSpeednumber1Rotation speed multiplier.autoStartbooleantrueStart animation automatically on mount.

## MapMeteor

Renders animated meteors falling from sky with fiery trail and impact effect. Supports single or shower mode. Must be used inside Map. Use useMeteorControl hook to control programmatically.
PropTypeDefaultDescriptionidstring—Unique identifier for the meteor.target[number, number]—Impact coordinates [longitude, latitude].sizenumber300Effect canvas size in pixels.anglenumber45Meteor entry angle in degrees.speednumber1500Fall duration in milliseconds.intensitynumber1Effect intensity multiplier.meteorColorstring"#ffaa00"Meteor body color.trailColorstring"#ff6600"Meteor trail color.impactColorstring"#ffdd00"Impact flash color.tailLengthnumber0.4Tail length as fraction of canvas size.meteorSizenumber8Meteor head radius in pixels.impactSizenumber0.3Impact radius as fraction of canvas size.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the meteor animation.loopDelaynumber2000Delay before restarting loop in milliseconds.showerbooleanfalseEnable meteor shower mode with multiple meteors.showerCountnumber5Number of meteors in shower mode.

## MapLightning

Renders animated lightning bolt strikes with branching and flash effects. Must be used inside Map. Use useLightningControl hook to trigger strikes programmatically.
PropTypeDefaultDescriptionidstring—Unique identifier for the lightning.coordinates[number, number]—Coordinates [longitude, latitude] for the lightning strike zone.sizenumber200Lightning canvas size in pixels.boltColorstring"#ffffff"Lightning bolt color.flashColorstring"#e0e8ff"Flash illumination color.flashIntensitynumber0.6Flash brightness (0-1).autoStrikebooleantrueEnable automatic periodic strikes.strikeIntervalnumber4000Interval between auto-strikes in milliseconds.boltWidthnumber4Main bolt width in pixels.branchProbabilitynumber0.3Probability of branching at each segment (0-1).

## MapSteam

Renders a rising steam effect with wispy particle animation. Must be used inside Map. Use useSteamControl hook to control programmatically.
PropTypeDefaultDescriptionidstring—Unique identifier for the steam effect.coordinates[number, number]—Coordinates [longitude, latitude] for the steam position.sizenumber100Steam canvas size in pixels.intensitynumber1Steam intensity multiplier.particleCountnumber40Number of steam particles.colorstring"#ffffff"Steam particle color.driftnumber0.4Horizontal drift amount.riseSpeednumber1Vertical rise speed multiplier.autoStartbooleantrueStart animation automatically on mount.

## MapTsunami

Renders an animated tsunami wave effect with incoming wave, crashing foam, and debris. Must be used inside Map. Use useTsunamiControl hook to control programmatically.
PropTypeDefaultDescriptionidstring—Unique identifier for the tsunami.origin[number, number]—Wave origin coordinates [longitude, latitude].target[number, number]—Wave target/impact coordinates [longitude, latitude].sizenumber300Tsunami canvas size in pixels.waveHeightnumber0.4Wave height as fraction of canvas size.waveWidthnumber0.8Wave width as fraction of canvas size.speednumber3000Wave approach duration in milliseconds.waterColorstring"#0077be"Wave water color.foamColorstring"#ffffff"Wave foam/crest color.particleCountnumber40Number of foam and debris particles on crash.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the tsunami animation.loopDelaynumber2000Delay before restarting loop in milliseconds.

## MapMusicDisc

Renders a rotating vinyl disc with floating music notes at map coordinates. Must be used inside Map.
PropTypeDefaultDescriptioncoordinates[number, number]—Coordinates [longitude, latitude] for disc position.sizenumber64Disc diameter in pixels.imagestring—Album cover image URL for the disc center.spinningbooleantrueEnable disc rotation animation.spinDurationnumber4000Full rotation duration in milliseconds.showNotesbooleantrueShow floating music note animations.noteColorstring"#a855f7"Music note color.discColorstring"#0a0a0a"Disc background color.centerColorstring"#171717"Disc center/label area color.pitchAlignment"map" | "viewport" | "auto""viewport"How the disc aligns with the map pitch.classNamestring—Additional CSS classes for the disc container.

## MapAnimatedFootprint

Renders animated footprint steps that walk along a path on the map. Must be used inside Map.
PropTypeDefaultDescriptionpath[number, number][]—Array of [longitude, latitude] pairs defining the walking path.colorstring"currentColor"Footprint icon color.sizenumber20Footprint icon size in pixels.stepSpacingnumber48Distance between steps in meters.staggerDelaynumber200Delay between revealing each step in milliseconds.durationnumber400Fade-in duration per step in milliseconds.autoStartbooleantrueStart animation automatically on mount.loopbooleanfalseLoop the walking animation.classNamestring—Additional CSS classes for each footprint element.

## MapGrid

Renders a coordinate grid overlay with latitude/longitude lines and labels. Must be used inside Map.
PropTypeDefaultDescriptionidstring"map-grid"Unique identifier prefix for grid sources and layers.latitudeIntervalnumber10Degrees between latitude lines.longitudeIntervalnumber10Degrees between longitude lines.lineColorstring"#ffffff"Grid line color.lineOpacitynumber0.3Grid line opacity (0-1).lineWidthnumber1Grid line width in pixels.showLabelsbooleantrueShow coordinate labels at line intersections.labelColorstring"#ffffff"Label text color.labelSizenumber10Label font size in pixels.labelBackgroundstring"rgba(0, 0, 0, 0.5)"Label background color.

## MapRadar

Renders an animated radar sweep signal overlay at map coordinates. Must be used inside Map.
PropTypeDefaultDescriptionidstring—Unique identifier for the radar.coordinates[number, number]—Coordinates [longitude, latitude] for the radar position.sizenumber200Radar display size in pixels.colorstring"rgba(0, 255, 70, 1)"Sweep and ring color.gridColorstring"rgba(0, 255, 70, 0.3)"Grid line color.backgroundColorstring"rgba(0, 20, 0, 0.8)"Radar background color.durationnumber2000Full sweep rotation duration in milliseconds.ringsnumber4Number of concentric range rings.showCrosshairsbooleantrueShow crosshair lines through the center.

## MapWatermark

Renders a text watermark overlay on the map with configurable position. Must be used inside Map.
PropTypeDefaultDescriptionchildrenReactNode—Watermark content (typically text).position"center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom" | "left" | "right""center"Watermark position on the map.classNamestring"text-[8rem] font-extrabold..."CSS classes for styling. Defaults to large translucent text.

## MarkerAvatar

Renders an avatar image with optional status indicator. Must be used inside MarkerContent.
PropTypeDefaultDescriptionsrcstring—Image source URL.altstring—Alt text for the image.sizenumber40Size of the avatar in pixels.onlineboolean—Show online status indicator.statusColor"green" | "red" | "yellow" | "blue""green"Status indicator color.classNamestring—Additional CSS classes for the avatar container.

## MarkerAvatarPin

Renders an avatar inside a teardrop/pin shape that points to the exact location. Must be used inside MarkerContent.
PropTypeDefaultDescriptionsrcstring—Image source URL.altstring—Alt text for the image.sizenumber56Diameter of the circular avatar in pixels.borderWidthnumber4Border thickness in pixels.classNamestring—Additional CSS classes for the pin container.



---

## 5. Map Style Presets & Themes

The `<Map />` component integrates with `next-themes` to dynamically switch styles. You can pass the `styles` prop with custom light/dark configurations or use built-in presets:

| Preset Name | Light Style URL | Dark Style URL | Description |
| :--- | :--- | :--- | :--- |
| `defaultMapStyles` | `light-v11` | `dark-v11` | Minimal general-purpose styles. |
| `standardMapStyles` | `standard` | `standard` | Mapbox Standard 3D style with building/landmark lighting. |
| `streetsMapStyles` | `streets-v12` | `dark-v11` | Detailed streets, transit, and POIs. |
| `outdoorsMapStyles` | `outdoors-v12` | `dark-v11` | Topography, trails, and terrain. |
| `satelliteMapStyles` | `satellite-streets-v12` | `satellite-streets-v12` | High-res satellite imagery. |
| `navigationMapStyles` | `navigation-day-v1` | `navigation-night-v1` | High-contrast roads for driving. |
| `defaultMapLibreStyles`| CARTO Light | CARTO Dark | Open-source styles for MapLibre. |

```tsx
import { Map } from "@/registry/map";
import { standardMapStyles } from "@/registry/map/types";

// Using Standard 3D style preset
<Map accessToken={token} styles={standardMapStyles} center={[-74.006, 40.7128]} zoom={12} />
```

---

## 6. React Hooks for Programmatic Control

All hooks return functions to manipulate layers/states on active maps. Note that hooks like `useCycloneControl`, `useFireControl`, etc., target a specific element matching the `id` string passed to them.


## useMap

Access the Mapbox GL map instance and loading state. Must be used within a Map component.

```tsx
import { useMap } from "@/registry/map";

const MyComponent = () => {
  const { map, isLoaded } = useMap();

  const flyToLocation = () => {
    if (!map) return;

    map.flyTo({
      center: [-74.006, 40.7128],
      zoom: 14,
    });
  };

  return (
    <button onClick={flyToLocation} disabled={!isLoaded}>
      Fly to NYC
    </button>
  );
};
```
Return ValueTypeDescriptionmapmapboxgl.Map | nullThe Mapbox GL map instanceisLoadedbooleanWhether the map has finished loading

## useRasterVideoControl

Control video layer playback. Pass the layer ID to control a specific MapRasterVideo component.

```tsx
import { useRasterVideoControl } from "@/registry/map";

const VideoControls = () => {
  const { play, pause, toggle, isPlaying } = useRasterVideoControl("my-video-layer");

  return (
    <div className="flex gap-2">
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={toggle}>
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
};
```
ParameterTypeDescriptionlayerIdstringThe ID of the video layer to controlReturn ValueTypeDescriptionplay() => voidStart video playbackpause() => voidPause video playbacktoggle() => voidToggle between play and pauseisPlayingbooleanCurrent playback state

## useLineAnimatedControl

Control animated line playback state. Use with MapLineAnimated component.

```tsx
import { useLineAnimatedControl, MapLineAnimated } from "@/registry/map";

const AnimatedRoute = () => {
  const { isPlaying, start, stop, toggle } = useLineAnimatedControl();

  return (
    <>
      <MapLineAnimated
        id="route"
        path={routePath}
        autoStart={isPlaying}
      />
      <button onClick={toggle}>
        {isPlaying ? "Stop" : "Start"} Animation
      </button>
    </>
  );
};
```
Return ValueTypeDescriptionstart() => voidStart the animationstop() => voidStop the animationtoggle() => voidToggle animation stateisPlayingbooleanCurrent animation state

## useMarkerAnimatedControl

Control animated marker playback state. Use with MapMarkerAnimated component.

```tsx
import { useMarkerAnimatedControl, MapMarkerAnimated } from "@/registry/map";

const AnimatedMarker = () => {
  const { isPlaying, start, stop, toggle } = useMarkerAnimatedControl();

  return (
    <>
      <MapMarkerAnimated
        id="marker"
        coordinates={pathCoordinates}
        autoStart={isPlaying}
      />
      <button onClick={toggle}>
        {isPlaying ? "Stop" : "Start"} Marker
      </button>
    </>
  );
};
```
Return ValueTypeDescriptionstart() => voidStart the animationstop() => voidStop the animationtoggle() => voidToggle animation stateisPlayingbooleanCurrent animation state

## useCameraFollowControl

Control camera follow animation playback. Use with MapCameraFollow component.

```tsx
import { useCameraFollowControl, MapCameraFollow, MapLine } from "@/registry/map";

const CameraFollow = () => {
  const { isPlaying, start, stop, toggle } = useCameraFollowControl();

  return (
    <>
      <MapLine coordinates={route} color="#3b82f6" width={4} />
      <MapCameraFollow
        path={route}
        autoStart={isPlaying}
        onComplete={stop}
        marker
      />
      <button onClick={toggle}>
        {isPlaying ? "Pause" : "Fly Along Route"}
      </button>
    </>
  );
};
```
Return ValueTypeDescriptionstart() => voidStart the camera animationstop() => voidStop the camera animationtoggle() => voidToggle animation stateisPlayingbooleanCurrent animation state

## useArcAnimatedControl

Control animated arc playback state. Use with MapArcAnimated component.

```tsx
import { useArcAnimatedControl, MapArcAnimated } from "@/registry/map";

const AnimatedArc = () => {
  const { isPlaying, start, stop, toggle } = useArcAnimatedControl();

  return (
    <>
      <MapArcAnimated
        id="arc"
        origin={[-74.006, 40.7128]}
        destination={[2.3522, 48.8566]}
      />
      <button onClick={toggle}>
        {isPlaying ? "Stop" : "Start"} Arc
      </button>
    </>
  );
};
```
Return ValueTypeDescriptionstart() => voidStart the animationstop() => voidStop the animationtoggle() => voidToggle animation stateisPlayingbooleanCurrent animation state

## useFootprintControl

Control animated footprint start and reset. Returns null until the component with the matching ID mounts.

```tsx
import { useFootprintControl, MapAnimatedFootprint } from "@/registry/map";

const FootprintControls = () => {
  const control = useFootprintControl("my-footprint");

  return (
    <>
      <MapAnimatedFootprint
        id="my-footprint"
        path={walkingPath}
        autoStart={false}
      />
      <button onClick={control?.start} disabled={control?.isActive}>
        Start Walking
      </button>
      <button onClick={control?.reset} disabled={!control?.isActive}>
        Reset
      </button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the footprint component to controlReturn ValueTypeDescriptionstart() => voidStart the footprint animationreset() => voidReset and hide all footprint stepsisActivebooleanWhether the animation is currently active

## useCycloneControl

Control cyclone animation, intensity, scale, and rotation speed. Returns null until the component with the matching ID mounts.

```tsx
import { useCycloneControl, MapCyclone } from "@/registry/map";

const Cyclone = () => {
  const control = useCycloneControl("my-cyclone");

  return (
    <>
      <MapCyclone id="my-cyclone" coordinates={[139.6917, 35.6895]} />
      <button onClick={control?.isActive ? control.stop : control?.start}>
        {control?.isActive ? "Stop" : "Start"} Cyclone
      </button>
      <button onClick={() => control?.setIntensity(1.5)}>
        High Intensity
      </button>
      <button onClick={() => control?.setRotationSpeed(3)}>
        Fast Spin
      </button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the cyclone component to controlReturn ValueTypeDescriptionstart() => voidStart the cyclone animationstop() => voidStop the cyclone animationsetIntensity(intensity: number) => voidSet the cyclone intensitysetScale(scale: number, instant?: boolean) => voidSet the cyclone scale with optional instant transitionsetRotationSpeed(speed: number) => voidSet the cyclone rotation speed (0-4)isActivebooleanWhether the cyclone is animatingisMovingbooleanWhether the cyclone is moving along a pathprogressnumberAnimation progress from 0 to 1scalenumberCurrent cyclone scalerotationSpeednumberCurrent rotation speed

## useExplosionControl

Trigger and reset explosion effects. Returns null until the component with the matching ID mounts.

```tsx
import { useExplosionControl, MapExplosion } from "@/registry/map";

const Explosion = () => {
  const control = useExplosionControl("my-explosion");

  return (
    <>
      <MapExplosion id="my-explosion" coordinates={[-74.006, 40.7128]} />
      <button onClick={control?.trigger}>Trigger Explosion</button>
      <button onClick={control?.reset}>Reset</button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the explosion component to controlReturn ValueTypeDescriptiontrigger() => voidTrigger the explosionreset() => voidReset the explosion stateisExplodingbooleanWhether the explosion is active

## useFireControl

Control fire animation and intensity. Returns null until the component with the matching ID mounts.

```tsx
import { useFireControl, MapFire } from "@/registry/map";

const Fire = () => {
  const control = useFireControl("my-fire");

  return (
    <>
      <MapFire id="my-fire" coordinates={[-122.4194, 37.7749]} />
      <button onClick={control?.isActive ? control.stop : control?.start}>
        {control?.isActive ? "Extinguish" : "Ignite"}
      </button>
      <button onClick={() => control?.setIntensity(0.9)}>
        Max Intensity
      </button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the fire component to controlReturn ValueTypeDescriptionstart() => voidStart the fire animationstop() => voidStop the fire animationsetIntensity(intensity: number) => voidSet the fire intensityisActivebooleanWhether the fire is burningspreadProgressnumberFire spread progress from 0 to 1

## useLightningControl

Trigger lightning strike effects. Returns null until the component with the matching ID mounts.

```tsx
import { useLightningControl, MapLightning } from "@/registry/map";

const Lightning = () => {
  const control = useLightningControl("my-lightning");

  return (
    <>
      <MapLightning id="my-lightning" coordinates={[-87.6298, 41.8781]} />
      <button onClick={control?.strike}>Strike!</button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the lightning component to controlReturn ValueTypeDescriptionstrike() => voidTrigger a lightning strikeisActivebooleanWhether a strike is in progress

## useMeteorControl

Control meteor animation and track impact phases. Returns null until the component with the matching ID mounts.

```tsx
import { useMeteorControl, MapMeteor } from "@/registry/map";

const Meteor = () => {
  const control = useMeteorControl("my-meteor");

  return (
    <>
      <MapMeteor id="my-meteor" target={[37.6173, 55.7558]} />
      <button onClick={control?.isActive ? control.stop : control?.start}>
        {control?.isActive ? "Stop" : "Launch"} Meteor
      </button>
      <p>Phase: {control?.phase}</p>
      <p>Progress: {Math.round((control?.progress ?? 0) * 100)}%</p>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the meteor component to controlReturn ValueTypeDescriptionstart() => voidStart the meteor animationstop() => voidStop the meteor animationreset() => voidReset the meteor to initial stateisActivebooleanWhether the meteor is animatingprogressnumberAnimation progress from 0 to 1phase"falling" | "impact" | "fading" | "idle"Current meteor phase

## useSandstormControl

Control sandstorm animation and intensity. Returns null until the component with the matching ID mounts.

```tsx
import { useSandstormControl, MapSandstorm } from "@/registry/map";

const Sandstorm = () => {
  const control = useSandstormControl("my-sandstorm");

  return (
    <>
      <MapSandstorm id="my-sandstorm" />
      <button onClick={control?.isActive ? control.stop : control?.start}>
        {control?.isActive ? "Stop" : "Start"} Sandstorm
      </button>
      <button onClick={() => control?.setIntensity(0.7)}>
        Increase Intensity
      </button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the sandstorm component to controlReturn ValueTypeDescriptionstart() => voidStart the sandstorm animationstop() => voidStop the sandstorm animationsetIntensity(intensity: number) => voidSet the sandstorm intensityisActivebooleanWhether the sandstorm is active

## useSnowControl

Control snow animation and intensity. Returns null until the component with the matching ID mounts.

```tsx
import { useSnowControl, MapSnow } from "@/registry/map";

const Snow = () => {
  const control = useSnowControl("my-snow");

  return (
    <>
      <MapSnow id="my-snow" />
      <button onClick={control?.isActive ? control.stop : control?.start}>
        {control?.isActive ? "Stop" : "Start"} Snow
      </button>
      <button onClick={() => control?.setIntensity(0.5)}>
        Light Snow
      </button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the snow component to controlReturn ValueTypeDescriptionstart() => voidStart the snow animationstop() => voidStop the snow animationsetIntensity(intensity: number) => voidSet the snow intensityisActivebooleanWhether the snow is falling

## useSteamControl

Control steam animation and intensity. Returns null until the component with the matching ID mounts.

```tsx
import { useSteamControl, MapSteam } from "@/registry/map";

const Steam = () => {
  const control = useSteamControl("my-steam");

  return (
    <>
      <MapSteam id="my-steam" coordinates={[-155.2833, 19.4069]} />
      <button onClick={control?.isActive ? control.stop : control?.start}>
        {control?.isActive ? "Stop" : "Start"} Steam
      </button>
      <button onClick={() => control?.setIntensity(0.6)}>
        Medium Steam
      </button>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the steam component to controlReturn ValueTypeDescriptionstart() => voidStart the steam animationstop() => voidStop the steam animationsetIntensity(intensity: number) => voidSet the steam intensityisActivebooleanWhether the steam is active

## useTsunamiControl

Control tsunami animation and track wave phases. Returns null until the component with the matching ID mounts.

```tsx
import { useTsunamiControl, MapTsunami } from "@/registry/map";

const Tsunami = () => {
  const control = useTsunamiControl("my-tsunami");

  return (
    <>
      <MapTsunami id="my-tsunami" origin={[142.3728, 38.3215]} target={[141.0, 37.0]} />
      <button onClick={control?.isActive ? control.stop : control?.start}>
        {control?.isActive ? "Stop" : "Start"} Tsunami
      </button>
      <p>Phase: {control?.phase}</p>
      <p>Progress: {Math.round((control?.progress ?? 0) * 100)}%</p>
    </>
  );
};
```
ParameterTypeDescriptionidstringThe ID of the tsunami component to controlReturn ValueTypeDescriptionstart() => voidStart the tsunami animationstop() => voidStop the tsunami animationreset() => voidReset the tsunami to initial stateisActivebooleanWhether the tsunami is animatingprogressnumberAnimation progress from 0 to 1phase"approaching" | "crashing" | "receding" | "idle"Current tsunami phase[← PreviousComponents](/docs/components)[Next →Reference](/docs/api-reference)


---

## 7. Advanced Components & Custom Configurations

### A. Zoom-Based Values (Mapbox Expressions)
Use `createZoomInterpolation(maxValue, startZoom, endZoom)` to dynamically scale values.
```tsx
import { Map, MapRain, createZoomInterpolation } from "@/registry/map";

// Scales vignette and density smoothly as user zooms in/out
const density = createZoomInterpolation(0.8, 11, 13);
const vignette = createZoomInterpolation(0.5, 11, 13);

<MapRain density={density} vignette={vignette} />
```

### B. Custom Loader
You can provide custom loaders using the `loader` prop on `<Map />`:
```tsx
<Map 
  loader={<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />}
  showLoader={true} // Forces visibility
>
  ...
</Map>
```

### C. Map Comparison Slider
To display a side-by-side or vertical swipe comparator panel (creates its own map instances):
```tsx
import { MapCompare } from "@/registry/map";

<MapCompare
  accessToken={token}
  beforeStyle="mapbox://styles/mapbox/light-v11"
  afterStyle="mapbox://styles/mapbox/dark-v11"
  orientation="horizontal"
  defaultSize={50}
  showLabels={true}
/>
```

### D. Synced Multi-Maps
To display multiple synchronized maps that pan, zoom, and rotate in unison:
```tsx
import { MapSync } from "@/registry/map";

const maps = [
  { style: "mapbox://styles/mapbox/streets-v12", label: "Streets" },
  { style: "mapbox://styles/mapbox/satellite-v9", label: "Satellite" }
];

<MapSync
  accessToken={token}
  maps={maps}
  layout="horizontal" // "horizontal" | "vertical" | "grid"
  zoom={12}
/>
```

---

## 8. Performance Guidelines

* **Animated Pulses / Layers**: Pulses and weather particles perform continuous screen repaints. Limit the number of simultaneously active pulse/weather components, especially at wide-zoom ranges.
* **Footprints & Lines**: For walking routes with dense coordinate arrays, increase `stepSpacing` to lower the count of rendered DOM markers.
* **Cleanup**: Hooks automatically handle animation frame updates, but when doing custom state changes inside callbacks, ensure listeners are throttled or debounced.
