import player

# создадим функцию, которая перемещает игрока по относительным координатам
# подробный разбор подобного кода можно найти в примерах к player.find
def move_to(pos):
    if pos[0] > 0:
        player.right()
        player.move(pos[0])
        player.left()
    elif pos[0] < 0:
        player.left()
        player.move(-pos[0])
        player.right()
    if pos[1] > 0:
        player.move(pos[1])
    elif pos[1] < 0:
        player.right()
        player.right()
        player.move(-pos[1])

# подберем 3 нейрона
for i in range(3):
    # найти ближайший нейрон и дойти до него
    neuron = player.find('neuron')
    move_to(neuron)

    # подобрать нейрон
    player.pickup('neuron')

# поместим все 3 нейрона на целевые позиции
for i in range(3):
    # нам нужно найти цель, на которой еще не лежит нейрон
    valid_target = None
    # для этого найдем и переберем все цели
    for target in player.find_all('target'):
        # для каждой цели проверим, находится ли на ней нейрон
        if 'neuron' not in player.inspect(target[0], target[1]):
            # если нейрона нет - то цель подходит, выходим из цикла
            valid_target = target
            break
    # дойдем до подходящей цели
    move_to(valid_target)
    # поместим на нее нейрон
    player.place('neuron')