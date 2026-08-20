splitBubble(bubble) {
    var colorType = this.bonusManager.getColorType(bubble.hue);
    if (!colorType) return;
    if (this.bubbles.length >= 40) return;
    
    var options = this.getSplitOptions(colorType);
    if (!options || options.children.length === 0) return;
    
    // ===== СТАНДАРТНЫЕ РАЗМЕРЫ ДЛЯ ЦВЕТОВ =====
    var sizeMap = {
        'red': { min: 40, max: 55 },
        'yellow': { min: 30, max: 45 },
        'green': { min: 22, max: 35 },
        'blue': { min: 16, max: 25 },
        'pink': { min: 12, max: 18 }
    };
    
    var maxNew = Math.min(options.children.length, 40 - this.bubbles.length);
    for (var s = 0; s < maxNew; s++) {
        var childColor = options.children[s];
        var newBubble = new Bubble(this.width, this.height);
        
        // ===== РАЗМЕР ПО ЦВЕТУ =====
        var size = sizeMap[childColor] || { min: 20, max: 30 };
        newBubble.radius = size.min + Math.random() * (size.max - size.min);
        
        // Цвет
        var hueMap = { 'red': 0, 'yellow': 45, 'green': 120, 'blue': 200, 'pink': 320 };
        newBubble.hue = hueMap[childColor] + (Math.random() - 0.5) * 20;
        if (newBubble.hue < 0) newBubble.hue += 360;
        if (newBubble.hue >= 360) newBubble.hue -= 360;
        
        // Позиция с разлётом
        var angle = Math.random() * Math.PI * 2;
        var distance = 20 + Math.random() * 30;
        newBubble.x = bubble.x + Math.cos(angle) * distance;
        newBubble.y = bubble.y + Math.sin(angle) * distance;
        newBubble.speed = bubble.speed * (0.7 + Math.random() * 0.6);
        
        this.bubbles.push(newBubble);
    }
}
