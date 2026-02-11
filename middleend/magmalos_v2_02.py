import matplotlib.pyplot as plt
import numpy as np
import matplotlib.animation as animation

# Simulation parameters
vent_radius = 50  # Volcano diameter (m)
vent_height = 20  # Volcano height (m)
n_particles = 500  # Number of particles
gravity = 9.81  # Gravity (m/s^2)
air_resistance = 0.98  # Air resistance
max_height = 60  # Maximum height (m)
intensity = 12  # Explosion intensity
base_size = 100  # Volcano base size (increase for better display)
height = 15  # Volcano starting height
spread = 4  # Explosion spread factor
eruption_time = 10  # Eruption start time
frame_interval = 100  # Time between frames (ms)

# Settlement details (distances in kilometers)
settlements = [
    (30, 0, 'Pompeii-de Evrim'),  # 30 km east of the volcano
    (70, 0, 'Atlantis-te Buğra'),  # 70 km east of the volcano
    (-90, 0, 'Miyazaki-de Tuana')  # 90 km west of the volcano
]

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

    # Incorporate vent-specific effects
    vent_effect = (vent_radius / (vent_radius + d)) * np.exp(-vent_height / max_height)
    z += vent_effect

    return x, y, z

def update_plot(frame, intensity, size, spread, vent_radius, vent_height, plot, settlements):
    """Update the animation plot for each frame."""
    x, y, z = simulate_volcano(intensity, size, spread, frame, vent_radius, vent_height)
    plot[0].remove()

    # Update the contour plot for temperature distribution
    plot[0] = ax.contourf(x, y, z, cmap='hot', levels=100, alpha=0.8)

    # Update settlement positions and impact
    for settlement in settlements:
        ax.plot(settlement[0], settlement[1], 'bo')  # Blue dots for settlements
        ax.text(settlement[0], settlement[1], settlement[2], color='white', fontsize=10, weight='bold')

        # Calculate impact on settlement
        dist = np.sqrt(settlement[0]**2 + settlement[1]**2)
        impact = intensity * np.exp(-dist / spread) * np.exp(-frame / 10)
        
        # Adjusted impact text position further down (settlement[1] - 5)
        ax.text(settlement[0], settlement[1] - 5, f'Impact: {impact:.2f} km', color='black', fontsize=9)

# Set up the figure and axis
fig, ax = plt.subplots(figsize=(16, 12))  # Larger figure size
x, y, z = simulate_volcano(intensity, base_size, spread, 0, vent_radius, vent_height)
plot = [ax.contourf(x, y, z, cmap='hot', levels=100)]
plt.colorbar(plot[0], ax=ax, label='Temperature Intensity')
plt.title('Enhanced Volcano Eruption Simulation')
plt.xlabel('Distance (km)')
plt.ylabel('Distance (km)')

# Plot initial settlements
for settlement in settlements:
    ax.plot(settlement[0], settlement[1], 'bo')  # Blue dots for settlements
    ax.text(settlement[0], settlement[1], settlement[2], color='white', fontsize=10, weight='bold')

# Create the animation
ani = animation.FuncAnimation(fig, update_plot, frames=100, fargs=(
    intensity, base_size, spread, vent_radius, vent_height, plot, settlements), interval=frame_interval)

plt.show()
