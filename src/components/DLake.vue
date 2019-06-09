<template>
  <div :id="id" class="dlake-layout">
    <v-list v-if="roles" class="dlake-roles">
      <v-list-tile v-if="role !== '_id'"
        v-for="role in Object.keys(roles)" :key="role"
        @click="handleRoleSelect(role)">
        <v-list-tile-content>
          <v-list-tile-title>{{ role }}</v-list-tile-title>
        </v-list-tile-content>
        <v-list-tile-action style="width: 64px; flex-direction: row; align-items: center;">
          <v-btn flat icon color="error" @click.stop="handleRoleDelete(role)">
            <v-icon>delete</v-icon>
          </v-btn>

          <v-btn flat icon color="primary" @click.stop="handleRessourceAdd(role)">
            <v-icon>add</v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>

      <v-btn style="margin-bottom: 32px;"
        absolute dark fab right bottom small color="blue lighten-2"
        @click.stop="handleRoleAdd">
        <v-icon>add</v-icon>
      </v-btn>
    </v-list>

    <div v-if="role && roles" class="dlake-role">
      <div class="dlake-ressource elevation-1"
        v-for="ressource in Object.keys(roles[role])" :key="ressource">
        <div class="dlake-rsc-title">
          <h3>{{ ressource }}</h3>

          <v-btn flat icon color="error"
            @click.stop="handleRessourceDelete(role, ressource)">
            <v-icon>delete</v-icon>
          </v-btn>

          <v-btn flat icon color="primary"
            @click.stop="handleAccessAdd(role, ressource)">
            <v-icon>add</v-icon>
          </v-btn>
        </div>
        <div class="dlake-access"
          v-for="access in Object.keys(roles[role][ressource])" :key="access">
          <v-text-field :label="access" v-model="roles[role][ressource][access]">
          </v-text-field>
          <v-btn flat icon color="error"
            @click.stop="handleAccessDelete(role, ressource, access)">
            <v-icon>delete</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <v-dialog v-model="addRoleDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ $t('Add a new role') }}
        </v-card-title>
        <v-card-text>
          <v-text-field :label="access" v-model="roleName">
          </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" flat @click.stop="addRole">
            {{ $t('Apply') }}</v-btn>
          <v-btn color="error" flat @click.stop="addRoleDialog = false">
            {{ $t('Cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="roleUnderModification" max-width="500px">
      <v-card>
        <v-card-title>
          {{ $t('Add a new ressource') }}
        </v-card-title>
        <v-card-text>
          <v-text-field :label="access" v-model="ressourceName">
          </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" flat @click.stop="addRessource">
            {{ $t('Apply') }}</v-btn>
          <v-btn color="error" flat @click.stop="roleUnderModification = null">
            {{ $t('Cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="ressourceUnderModification" max-width="500px">
      <v-card>
        <v-card-title>
          {{ $t('Add a new access') }}
        </v-card-title>
        <v-card-text>
          <v-text-field :label="access" v-model="accessName">
          </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" flat @click.stop="addAccess">
            {{ $t('Apply') }}</v-btn>
          <v-btn color="error" flat @click.stop="ressourceUnderModification = null">
            {{ $t('Cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: [ ],
  data: () => {
    return {
      id: 'dlake_' + Math.random().toString(36).slice(2),
      roles: null,
      role: null,
      roleName: '',
      ressourceName: '',
      accessName: '',
      addRoleDialog: false,
      roleUnderModification: null,
      ressourceUnderModification: null
    }
  },
  computed: {

  },
  methods: {
    update() {
      this.$modules.waitForService('data').then(data => {
        data.roles.put(this.roles).then(() => {
          this.$services.$emit('app:notification',
            this.$i18n.$t('Modifications has been done'))
        }).catch(err => console.log(err))
      }).catch(err => console.log(err))
    },
    handleRoleSelect(role) {
      this.role = role
    },
    handleRoleDelete(role) {
      delete this.roles[role]
      this.update()
    },
    handleRoleAdd() {
      this.addRoleDialog = true
    },
    addRole() {
      this.roles[roleName] = {}
      this.update()
    },
    handleRessourceAdd(role) {
      this.roleUnderModification = role
    },
    addRessource() {
      this.roles[roleUnderModification][ressourceName] = {}
      this.update()
    },
    handleRessourceDelete(role, ressource) {
      delete this.roles[role][ressource]
      this.update()
    },
    handleAccessAdd(role, ressource) {
      console.log(role, ressource)
      this.roleForRessourceUnderModification = role
      this.ressourceUnderModification = ressource
    },
    addAccess() {
      this.roles[roleForRessourceUnderModification][ressourceUnderModification][accessName] = {}
      this.update()
    },
    handleAccessDelete(role, ressource, access) {
      delete this.roles[role][ressource][access]
      this.update()
    }
  },
  mounted() {
    this.$modules.waitForService('data').then(data => {
      data.roles.get({}).then(roles => {
        this.roles = roles
      }).catch(err => console.log(err))
    }).catch(err => console.log(err))
  },
  beforeDestroy() {

  }
}
</script>

<style>
.dlake-layout {
  width: 100%;
  height: 100%;
  display: flex;
}

.dlake-roles {
  width: 300px;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.dlake-role {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.dlake-ressource:hover {
  background-color: rgba(255, 222, 173, 0.6);
}

.dlake-ressource {
  width: calc(100% - 8px);
  margin: 4px;
  padding: 8px;
  background-color: white;
}

.dlake-rsc-title {
  padding: 4px;
  display: flex;
  align-items: center;
}

.dlake-access {
  padding: 4px;
  display: flex;
  align-items: center;
}
</style>
