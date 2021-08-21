import player

# кол-во собранных предметов
collected_count = 0

# кол-во ходов при поиске для определения очередности действий
explore_moves = 0

# пока собрано менее 3 съедобных предметов
while collected_count < 3:
    # найти ближайшую еду
    food = player.find('food')

    # если еда найдена, дойти до нее (подробное описание алгоритма
    # можно найти в примерах использования метода player.find)
    if food is not None:
        if food[0] > 0:
            player.right()
            player.move(food[0])
            player.left()
        elif food[0] < 0:
            player.left()
            player.move(-food[0])
            player.right()

        if food[1] > 0:
            player.move(food[1])
        elif food[1] < 0:
            player.right()
            player.right()
            player.move(-food[1])

        # взять предмет и увеличить кол-во собранных предметов
        player.pickup('food')
        collected_count += 1

    # если еды не видно, начинать обходить комнату кругами.
    # при этом последовательность действий выглядит так:
    # - 2 шага вперед, поиск
    # - 2 шага вперед, поиск
    # - 2 шага вперед, поиск
    # - 2 шага вперед, направо, поиск
    # таким образом обойдет комнату по периметру часто останавливаясь для поиска
    else:
        # перед каждым поиском сдвинуться на 2 клетки
        player.move(2)
        # каждый четвертый раз еще и повернуть направо
        if explore_moves % 4 == 1:
            player.right()
        explore_moves += 1
        # здесь программа вернется в начало цикла и повторит поиск
