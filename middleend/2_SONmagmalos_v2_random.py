import matplotlib.pyplot as plt
import numpy as np
import matplotlib.animation as animation

# Simulation parameters
vent_radius = 350  # Volcano diameter (m)
vent_height = 1700  # Volcano height (m), updated to 1700 meters
intensity = 50  # Explosion intensity
base_size = 100  # Volcano base size (increase for better display)
spread = 50  # Explosion spread factor5
eruption_time = 10  # Eruption start time (seconds)
frame_interval = 500  # Time between frames (ms)

# Maximum height for calculations (same unit as vent_height)
max_height = 2000  # Adjusted max height to avoid conflict with vent height

# Şehir mesafelerini rasgele belirliyoruz:
# Evrim (Pompeii-de): 0 ile 100 km arasında
# Buğra (Atlantis-te): 0 ile 100 km arasında
# Tuana (Miyazaki-de): -100 ile 0 km arasında
evrim_dist = np.random.uniform(0, 100)
bugra_dist = np.random.uniform(0, 100)
tuana_dist = np.random.uniform(-100, 0)

settlements = [
    (evrim_dist, 0, f"""Pompeii-de Evrim
     {evrim_dist:.1f} km"""),  
    (bugra_dist, 0, f"""Atlantis-te Buğra
     {bugra_dist:.1f} km"""),  
    (tuana_dist, 0, f"""Miyazaki-de Tuana
     {abs(tuana_dist):.1f} km""")   
]

# Energy decay function based on distance and time
def energy_at_distance(distance, intensity, time, decay_factor=0.1):
    """Calculate the energy at a given distance from the eruption center at a given time."""
    # Energy decays with distance and time
    energy = intensity / (1 + decay_factor * (distance**2)) * np.exp(-time / 10)
    return energy

def simulate_volcano(intensity, size, spread, time, vent_radius, vent_height):
    """Simulate volcanic eruption temperature distribution."""
    # Create a grid of points
    x = np.linspace(-size, size, 800)  # Increased resolution
    y = np.linspace(-size, size, 800)
    x, y = np.meshgrid(x, y)

    # Calculate distance from the center
    d = np.sqrt(x**2 + y**2)

    # Temperature distribution based on intensity, spread, and time
    z = intensity * np.exp(-d / spread) * np.exp(-time / 10)

    # Add shockwave effect for dynamic eruption visuals
    shockwave = np.sin(d - time) * (np.exp(-d / spread) * 0.5)
    z += shockwave * np.clip(intensity / (time + 1), 0, 1)

    # Incorporate vent-specific effects (vent height adjusted)
    vent_effect = (vent_radius / (vent_radius + d)) * np.exp(-vent_height / max_height)
    z += vent_effect

    return x, y, z, d  # Return distance array for calculating energy

def update_plot(frame, intensity, size, spread, vent_radius, vent_height, plot, settlements, impact_texts):
    """Update the animation plot for each frame."""
    x, y, z, distance_array = simulate_volcano(intensity, size, spread, frame, vent_radius, vent_height)
    plot[0].remove()

    # Update the contour plot for temperature distribution
    plot[0] = ax.contourf(x, y, z, cmap='hot', levels=100, alpha=0.8)

    # Update settlement positions and energy impact
    for i, settlement in enumerate(settlements):
        ax.plot(settlement[0], settlement[1], 'bo')  # Blue dots for settlements
        ax.text(settlement[0], settlement[1] + 2, settlement[2], color='white', fontsize=10, weight='bold')

        # Remove previous impact text if it exists
        if impact_texts[i] is not None:
            impact_texts[i].remove()

        # Calculate distance from the volcano to the settlement (in km)
        dist = np.sqrt(settlement[0]**2 + settlement[1]**2)

        # Calculate the energy impact at the settlement based on the distance and time
        energy_impact = energy_at_distance(dist, intensity, frame)

        # Display the updated energy impact (calculated as energy decay)
        impact_texts[i] = ax.text(settlement[0], settlement[1] - 5, f'Energy Impact: {energy_impact:.2f} J', color='black', fontsize=9)

# Set up the figure and axis
fig, ax = plt.subplots(figsize=(16, 12))  # Larger figure size
x, y, z, distance_array = simulate_volcano(intensity, base_size, spread, 0, vent_radius, vent_height)
plot = [ax.contourf(x, y, z, cmap='hot', levels=100)]
plt.colorbar(plot[0], ax=ax, label='Temperature Intensity')
plt.title('Enhanced Volcano Eruption Simulation with Dynamic Energy Impact')
plt.xlabel('Distance (km)')
plt.ylabel('Distance (km)')

# Plot initial settlements
for settlement in settlements:
    ax.plot(settlement[0], settlement[1], 'bo')  # Blue dots for settlements
    ax.text(settlement[0], settlement[1] + 2, settlement[2], color='white', fontsize=10, weight='bold')

# Initialize an empty list for the impact text objects (used for removal)
impact_texts = [None] * len(settlements)

# Create the animation
ani = animation.FuncAnimation(fig, update_plot, frames=eruption_time, fargs=(
    intensity, base_size, spread, vent_radius, vent_height, plot, settlements, impact_texts), interval=frame_interval)

plt.show()
